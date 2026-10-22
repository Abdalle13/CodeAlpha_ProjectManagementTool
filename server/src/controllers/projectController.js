import mongoose from "mongoose";
import { Project, PROJECT_STATUSES } from "../models/Project.js";
import { Activity } from "../models/Activity.js";
import { Comment } from "../models/Comment.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex, parsePagination } from "../utils/pagination.js";
import { publicProject } from "../utils/projectView.js";
import { isValidEmail, normalizeEmail } from "../utils/sanitize.js";

function parseOptionalDate(value, fieldName) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Enter a valid ${fieldName}.`, 400, "VALIDATION_ERROR");
  }
  return date;
}

function validateProjectInput(body, { partial = false } = {}) {
  const updates = {};

  if (!partial || body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (name.length < 2 || name.length > 120) {
      throw new AppError("Project name must be between 2 and 120 characters.", 400, "VALIDATION_ERROR");
    }
    updates.name = name;
  }

  if (!partial || body.description !== undefined) {
    const description = String(body.description || "").trim();
    if (description.length > 2000) {
      throw new AppError("Description must be 2000 characters or fewer.", 400, "VALIDATION_ERROR");
    }
    updates.description = description;
  }

  if (!partial || body.status !== undefined) {
    const status = body.status || "planned";
    if (!PROJECT_STATUSES.includes(status)) {
      throw new AppError("Choose a valid project status.", 400, "VALIDATION_ERROR");
    }
    updates.status = status;
  }

  if (!partial || body.startDate !== undefined) {
    updates.startDate = parseOptionalDate(body.startDate, "start date");
  }

  if (!partial || body.dueDate !== undefined) {
    updates.dueDate = parseOptionalDate(body.dueDate, "due date");
  }

  if (updates.startDate && updates.dueDate && updates.dueDate < updates.startDate) {
    throw new AppError("Due date cannot be earlier than the start date.", 400, "VALIDATION_ERROR");
  }

  return updates;
}

async function reloadProject(id) {
  return Project.findById(id).populate("owner", "name email").populate("members.user", "name email");
}

export const listProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = req.user.systemRole === "admin" ? {} : { "members.user": req.user._id };

  const q = String(req.query.q || "").trim();
  if (q.length > 100) {
    throw new AppError("Search query must be 100 characters or fewer.", 400, "VALIDATION_ERROR");
  }
  if (q) {
    filter.name = { $regex: escapeRegex(q), $options: "i" };
  }

  const status = String(req.query.status || "").trim();
  if (status) {
    if (!PROJECT_STATUSES.includes(status)) {
      throw new AppError("Choose a valid project status.", 400, "VALIDATION_ERROR");
    }
    filter.status = status;
  }

  const [items, total] = await Promise.all([
    Project.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "name email")
      .populate("members.user", "name email"),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map((project) => publicProject(project, req.user._id, req.user.systemRole)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    },
  });
});

export const createProject = asyncHandler(async (req, res) => {
  const fields = validateProjectInput(req.body);
  const project = await Project.create({
    ...fields,
    owner: req.user._id,
    members: [{ user: req.user._id, role: "owner", joinedAt: new Date() }],
  });
  await Activity.create({
    project: project._id,
    actor: req.user._id,
    action: "project.created",
    summary: `Created project ${project.name}`,
  });

  const populated = await reloadProject(project._id);
  res.status(201).json({
    success: true,
    data: { project: publicProject(populated, req.user._id, req.user.systemRole) },
  });
});

export const getProject = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { project: publicProject(req.project, req.user._id, req.user.systemRole) },
  });
});

export const updateProject = asyncHandler(async (req, res) => {
  const fields = validateProjectInput(req.body, { partial: true });
  const changedFields = Object.keys(fields).filter((field) => String(req.project[field] ?? "") !== String(fields[field] ?? ""));
  Object.assign(req.project, fields);
  await req.project.save();
  if (changedFields.length) {
    await Activity.create({
      project: req.project._id,
      actor: req.user._id,
      action: "project.updated",
      summary: `Updated project ${req.project.name}`,
      metadata: { fields: changedFields },
    });
  }
  const populated = await reloadProject(req.project._id);
  res.json({
    success: true,
    data: { project: publicProject(populated, req.user._id, req.user.systemRole) },
  });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.project._id;
  await Task.deleteMany({ project: projectId });
  await Comment.deleteMany({ project: projectId });
  await Activity.deleteMany({ project: projectId });
  await req.project.deleteOne();
  res.json({
    success: true,
    data: { project: null },
  });
});

export const addMember = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const role = req.body?.role || "member";

  if (!isValidEmail(email)) {
    throw new AppError("Enter a valid member email.", 400, "VALIDATION_ERROR");
  }
  if (!["admin", "member"].includes(role)) {
    throw new AppError("New members can be added as admin or member.", 400, "VALIDATION_ERROR");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("No Taskora account was found for that email.", 404, "NOT_FOUND");
  }

  if (req.project.members.some((member) => member.user._id.equals(user._id))) {
    throw new AppError("That person is already a member of this project.", 409, "CONFLICT");
  }

  req.project.members.push({ user: user._id, role, joinedAt: new Date() });
  await req.project.save();
  await Activity.create({
    project: req.project._id,
    actor: req.user._id,
    action: "project.member_added",
    summary: `Added ${user.name} to the project`,
    metadata: { userId: String(user._id), role },
  });
  const populated = await reloadProject(req.project._id);
  res.status(201).json({
    success: true,
    data: { project: publicProject(populated, req.user._id, req.user.systemRole) },
  });
});

export const updateMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const role = req.body?.role;

  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Member not found.", 404, "NOT_FOUND");
  }
  if (!["owner", "admin", "member"].includes(role)) {
    throw new AppError("Choose a valid member role.", 400, "VALIDATION_ERROR");
  }
  if (req.membership.role !== "owner" && role === "owner") {
    throw new AppError("Only an owner can grant ownership.", 403, "FORBIDDEN");
  }

  const member = req.project.members.find((item) => item.user._id.equals(userId));
  if (!member) {
    throw new AppError("Member not found.", 404, "NOT_FOUND");
  }
  if (req.membership.role !== "owner" && member.role === "owner") {
    throw new AppError("Only an owner can change an owner's role.", 403, "FORBIDDEN");
  }

  const ownerCount = req.project.members.filter((item) => item.role === "owner").length;
  if (member.role === "owner" && role !== "owner" && ownerCount < 2) {
    throw new AppError("A project needs at least one owner.", 400, "VALIDATION_ERROR");
  }

  member.role = role;
  if (role === "owner") {
    req.project.owner = member.user._id;
  }
  await req.project.save();
  await Activity.create({
    project: req.project._id,
    actor: req.user._id,
    action: "project.member_role_updated",
    summary: `Changed ${member.user.name}'s project role`,
    metadata: { userId: String(member.user._id), role },
  });
  const populated = await reloadProject(req.project._id);
  res.json({
    success: true,
    data: { project: publicProject(populated, req.user._id, req.user.systemRole) },
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Member not found.", 404, "NOT_FOUND");
  }

  const member = req.project.members.find((item) => item.user._id.equals(userId));
  if (!member) {
    throw new AppError("Member not found.", 404, "NOT_FOUND");
  }

  const isSelf = member.user._id.equals(req.user._id);
  if (!isSelf && !["owner", "admin"].includes(req.membership.role)) {
    throw new AppError("You do not have permission to do that.", 403, "FORBIDDEN");
  }
  if (req.membership.role === "admin" && member.role === "owner") {
    throw new AppError("Admins cannot remove an owner.", 403, "FORBIDDEN");
  }

  const ownerCount = req.project.members.filter((item) => item.role === "owner").length;
  if (member.role === "owner" && ownerCount < 2) {
    throw new AppError("A project needs at least one owner.", 400, "VALIDATION_ERROR");
  }

  req.project.members = req.project.members.filter((item) => !item.user._id.equals(userId));
  await req.project.save();
  await Activity.create({
    project: req.project._id,
    actor: req.user._id,
    action: "project.member_removed",
    summary: `Removed ${member.user.name} from the project`,
    metadata: { userId: String(member.user._id) },
  });
  const populated = await reloadProject(req.project._id);
  res.json({
    success: true,
    data: { project: publicProject(populated, req.user._id, req.user.systemRole) },
  });
});
