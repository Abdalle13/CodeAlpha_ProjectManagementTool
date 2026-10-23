import mongoose from "mongoose";
import { Project, PROJECT_STATUSES, PROJECT_PRIORITIES } from "../models/Project.js";
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

    if (!body.key) {
      const generated = name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
      updates.key = generated.length >= 2 ? generated : "PRJ";
    }
  }

  if (body.key !== undefined) {
    const key = String(body.key || "").trim().toUpperCase();
    if (key.length < 2 || key.length > 10) {
      throw new AppError("Project key must be between 2 and 10 uppercase characters.", 400, "VALIDATION_ERROR");
    }
    updates.key = key;
  }

  if (!partial || body.description !== undefined) {
    const description = String(body.description || "").trim();
    if (description.length > 2000) {
      throw new AppError("Description must be 2000 characters or fewer.", 400, "VALIDATION_ERROR");
    }
    updates.description = description;
  }

  if (!partial || body.status !== undefined) {
    const status = body.status || "active";
    if (!PROJECT_STATUSES.includes(status)) {
      throw new AppError("Choose a valid project status.", 400, "VALIDATION_ERROR");
    }
    updates.status = status;
  }

  if (body.priority !== undefined) {
    if (!PROJECT_PRIORITIES.includes(body.priority)) {
      throw new AppError("Choose a valid project priority.", 400, "VALIDATION_ERROR");
    }
    updates.priority = body.priority;
  }

  if (body.category !== undefined) {
    updates.category = body.category;
  }

  if (body.budget !== undefined) {
    updates.budget = Number(body.budget) || 0;
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
  return Project.findById(id)
    .populate("owner", "name email role department avatarColor")
    .populate("members.user", "name email role department avatarColor");
}

export const listProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const userRole = req.user.role || req.user.systemRole;
  const filter = userRole === "admin" ? {} : { "members.user": req.user._id };

  const q = String(req.query.q || "").trim();
  if (q.length > 100) {
    throw new AppError("Search query must be 100 characters or fewer.", 400, "VALIDATION_ERROR");
  }
  if (q) {
    const escaped = escapeRegex(q);
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { key: { $regex: escaped, $options: "i" } },
    ];
  }

  const status = String(req.query.status || "").trim();
  if (status && PROJECT_STATUSES.includes(status)) {
    filter.status = status;
  }

  const category = String(req.query.category || "").trim();
  if (category) {
    filter.category = category;
  }

  const [items, total] = await Promise.all([
    Project.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "name email role department avatarColor")
      .populate("members.user", "name email role department avatarColor"),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map((project) => publicProject(project, req.user._id, userRole)),
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
    user: req.user._id,
    action: "created",
    description: `${req.user.name} created project ${project.name} (${project.key})`,
  });

  const hydrated = await reloadProject(project._id);
  res.status(201).json({
    success: true,
    data: {
      project: publicProject(hydrated, req.user._id, req.user.role || req.user.systemRole),
    },
  });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await reloadProject(req.project._id);
  res.json({
    success: true,
    data: {
      project: publicProject(project, req.user._id, req.user.role || req.user.systemRole),
    },
  });
});

export const updateProject = asyncHandler(async (req, res) => {
  const updates = validateProjectInput(req.body, { partial: true });
  Object.assign(req.project, updates);
  await req.project.save();

  await Activity.create({
    project: req.project._id,
    user: req.user._id,
    action: "updated",
    description: `${req.user.name} updated project details`,
  });

  const hydrated = await reloadProject(req.project._id);
  res.json({
    success: true,
    data: {
      project: publicProject(hydrated, req.user._id, req.user.role || req.user.systemRole),
    },
  });
});

export const deleteProject = asyncHandler(async (req, res) => {
  await Promise.all([
    Task.deleteMany({ project: req.project._id }),
    Comment.deleteMany({ project: req.project._id }),
    Activity.deleteMany({ project: req.project._id }),
    req.project.deleteOne(),
  ]);

  res.json({
    success: true,
    data: { message: "Project and related records removed." },
  });
});

export const addMember = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const role = req.body?.role || "contributor";

  if (!isValidEmail(email)) {
    throw new AppError("Enter a valid email address.", 400, "VALIDATION_ERROR");
  }

  const userToAdd = await User.findOne({ email });
  if (!userToAdd || !userToAdd.isActive) {
    throw new AppError("No active user found with that email.", 404, "NOT_FOUND");
  }

  const existing = req.project.members.find(
    (member) => String(member.user) === String(userToAdd._id)
  );
  if (existing) {
    throw new AppError("That user is already a member of this project.", 409, "CONFLICT");
  }

  req.project.members.push({ user: userToAdd._id, role, joinedAt: new Date() });
  await req.project.save();

  await Activity.create({
    project: req.project._id,
    user: req.user._id,
    action: "updated",
    description: `${req.user.name} added ${userToAdd.name} to the team`,
  });

  const hydrated = await reloadProject(req.project._id);
  res.status(201).json({
    success: true,
    data: {
      project: publicProject(hydrated, req.user._id, req.user.role || req.user.systemRole),
    },
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const isSelf = String(req.user._id) === String(userId);
  const canManage = req.projectRole === "owner" || (req.user.role || req.user.systemRole) === "admin";

  if (!isSelf && !canManage) {
    throw new AppError("You do not have permission to remove this member.", 403, "FORBIDDEN");
  }

  if (String(req.project.owner) === String(userId)) {
    throw new AppError("The project owner cannot be removed.", 400, "OPERATION_NOT_ALLOWED");
  }

  req.project.members = req.project.members.filter(
    (member) => String(member.user) !== String(userId)
  );
  await req.project.save();

  await Activity.create({
    project: req.project._id,
    user: req.user._id,
    action: "updated",
    description: `${req.user.name} removed a member from the project`,
  });

  const hydrated = await reloadProject(req.project._id);
  res.json({
    success: true,
    data: {
      project: publicProject(hydrated, req.user._id, req.user.role || req.user.systemRole),
    },
  });
});

export const updateMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const VALID_ROLES = ["owner", "admin", "member"];
  if (!role || !VALID_ROLES.includes(role)) {
    throw new AppError("Choose a valid role: owner, admin, or member.", 400, "VALIDATION_ERROR");
  }

  if (role === "owner" && req.projectRole !== "owner") {
    throw new AppError("Only the project owner can transfer ownership.", 403, "FORBIDDEN");
  }

  const member = req.project.members.find(m => String(m.user) === String(userId));
  if (!member) {
    throw new AppError("That user is not a member of this project.", 404, "NOT_FOUND");
  }

  member.role = role;

  if (role === "owner") {
    req.project.members.forEach(m => {
      if (String(m.user) !== String(userId) && m.role === "owner") m.role = "admin";
    });
    req.project.owner = userId;
  }

  await req.project.save();

  await Activity.create({
    project: req.project._id,
    user: req.user._id,
    action: "updated",
    description: req.user.name + " changed a member's role to " + role,
  });

  const hydrated = await reloadProject(req.project._id);
  res.json({
    success: true,
    data: { project: publicProject(hydrated, req.user._id, req.user.role || req.user.systemRole) },
  });
});
