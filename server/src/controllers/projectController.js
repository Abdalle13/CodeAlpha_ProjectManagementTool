import { ProjectDB, ActivityDB, CommentDB, TaskDB } from "../models/db.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination } from "../utils/pagination.js";
import { publicProject } from "../utils/projectView.js";
import { isValidEmail, normalizeEmail } from "../utils/sanitize.js";
import { UserDB } from "../models/db.js";

export const PROJECT_STATUSES = ["planning", "active", "paused", "completed"];
export const PROJECT_PRIORITIES = ["low", "medium", "high", "urgent"];

function parseOptionalDate(value, fieldName) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(`Enter a valid ${fieldName}.`, 400, "VALIDATION_ERROR");
  return date;
}

function validateProjectInput(body, { partial = false } = {}) {
  const updates = {};
  if (!partial || body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (name.length < 2 || name.length > 120) throw new AppError("Project name must be between 2 and 120 characters.", 400, "VALIDATION_ERROR");
    updates.name = name;
    if (!body.key) {
      const generated = name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
      updates.key = generated.length >= 2 ? generated : "PRJ";
    }
  }
  if (body.key !== undefined) {
    const key = String(body.key || "").trim().toUpperCase();
    if (key.length < 2 || key.length > 10) throw new AppError("Project key must be between 2 and 10 uppercase characters.", 400, "VALIDATION_ERROR");
    updates.key = key;
  }
  if (!partial || body.description !== undefined) {
    const description = String(body.description || "").trim();
    if (description.length > 2000) throw new AppError("Description must be 2000 characters or fewer.", 400, "VALIDATION_ERROR");
    updates.description = description;
  }
  if (!partial || body.status !== undefined) {
    const status = body.status || "active";
    if (!PROJECT_STATUSES.includes(status)) throw new AppError("Choose a valid project status.", 400, "VALIDATION_ERROR");
    updates.status = status;
  }
  if (body.priority !== undefined) {
    if (!PROJECT_PRIORITIES.includes(body.priority)) throw new AppError("Choose a valid project priority.", 400, "VALIDATION_ERROR");
    updates.priority = body.priority;
  }
  if (body.category !== undefined) updates.category = body.category;
  if (body.budget !== undefined) updates.budget = Number(body.budget) || 0;
  if (!partial || body.startDate !== undefined) updates.startDate = parseOptionalDate(body.startDate, "start date");
  if (!partial || body.dueDate !== undefined) updates.dueDate = parseOptionalDate(body.dueDate, "due date");
  if (updates.startDate && updates.dueDate && updates.dueDate < updates.startDate) {
    throw new AppError("Due date cannot be earlier than the start date.", 400, "VALIDATION_ERROR");
  }
  return updates;
}

export const listProjects = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const userRole = req.user.role || req.user.systemRole;
  const isAdmin = userRole === "admin";
  const q = String(req.query.q || "").trim();
  if (q.length > 100) throw new AppError("Search query must be 100 characters or fewer.", 400, "VALIDATION_ERROR");
  const status = String(req.query.status || "").trim();
  const category = String(req.query.category || "").trim();

  const { items, total } = await ProjectDB.findAll({
    userId: req.user._id,
    isAdmin,
    search: q || undefined,
    status: (status && PROJECT_STATUSES.includes(status)) ? status : undefined,
    category: category || undefined,
    page,
    limit,
  });

  res.json({
    success: true,
    data: {
      items: items.map(p => publicProject(p, req.user._id, userRole)),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const createProject = asyncHandler(async (req, res) => {
  const fields = validateProjectInput(req.body);
  const project = await ProjectDB.create({ ...fields, ownerId: req.user._id });

  await ActivityDB.create({
    project: project._id,
    user: req.user._id,
    action: "created",
    description: `${req.user.name} created project ${project.name} (${project.key})`,
  });

  res.status(201).json({
    success: true,
    data: { project: publicProject(project, req.user._id, req.user.role || req.user.systemRole) },
  });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await ProjectDB.findById(req.project._id);
  res.json({
    success: true,
    data: { project: publicProject(project, req.user._id, req.user.role || req.user.systemRole) },
  });
});

export const updateProject = asyncHandler(async (req, res) => {
  const updates = validateProjectInput(req.body, { partial: true });
  const project = await ProjectDB.update(req.project._id, updates);

  await ActivityDB.create({
    project: req.project._id,
    user: req.user._id,
    action: "updated",
    description: `${req.user.name} updated project details`,
  });

  res.json({
    success: true,
    data: { project: publicProject(project, req.user._id, req.user.role || req.user.systemRole) },
  });
});

export const deleteProject = asyncHandler(async (req, res) => {
  await TaskDB.deleteMany({ project_id: req.project._id });
  await CommentDB.deleteMany({ project_id: req.project._id });
  await ActivityDB.deleteMany({ project_id: req.project._id });
  await ProjectDB.delete(req.project._id);

  res.json({ success: true, data: { message: "Project and related records removed." } });
});

export const addMember = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const role = req.body?.role || "contributor";

  if (!isValidEmail(email)) throw new AppError("Enter a valid email address.", 400, "VALIDATION_ERROR");

  const userToAdd = await UserDB.findOne({ email });
  if (!userToAdd || !userToAdd.isActive) throw new AppError("No active user found with that email.", 404, "NOT_FOUND");

  const existingMember = await ProjectDB.getMember(req.project._id, userToAdd._id);
  if (existingMember) throw new AppError("That user is already a member of this project.", 409, "CONFLICT");

  const project = await ProjectDB.addMember(req.project._id, userToAdd._id, role);

  await ActivityDB.create({
    project: req.project._id,
    user: req.user._id,
    action: "updated",
    description: `${req.user.name} added ${userToAdd.name} to the team`,
  });

  res.status(201).json({
    success: true,
    data: { project: publicProject(project, req.user._id, req.user.role || req.user.systemRole) },
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const isSelf = String(req.user._id) === String(userId);
  const canManage = req.projectRole === "owner" || (req.user.role || req.user.systemRole) === "admin";

  if (!isSelf && !canManage) throw new AppError("You do not have permission to remove this member.", 403, "FORBIDDEN");

  const ownerStr = String(req.project.owner?._id || req.project.owner_id || req.project.owner);
  if (ownerStr === String(userId)) throw new AppError("The project owner cannot be removed.", 400, "OPERATION_NOT_ALLOWED");

  const project = await ProjectDB.removeMember(req.project._id, userId);

  await ActivityDB.create({
    project: req.project._id,
    user: req.user._id,
    action: "updated",
    description: `${req.user.name} removed a member from the project`,
  });

  res.json({
    success: true,
    data: { project: publicProject(project, req.user._id, req.user.role || req.user.systemRole) },
  });
});

export const updateMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const VALID_ROLES = ["owner", "admin", "member"];
  if (!role || !VALID_ROLES.includes(role)) throw new AppError("Choose a valid role: owner, admin, or member.", 400, "VALIDATION_ERROR");
  if (role === "owner" && req.projectRole !== "owner") throw new AppError("Only the project owner can transfer ownership.", 403, "FORBIDDEN");

  const member = await ProjectDB.getMember(req.project._id, userId);
  if (!member) throw new AppError("That user is not a member of this project.", 404, "NOT_FOUND");

  if (role === "owner") {
    await ProjectDB.update(req.project._id, { ownerId: userId });
    // Change old owner role to admin
    const proj = await ProjectDB.findById(req.project._id);
    const oldOwner = proj.members.find(m => {
      const mid = String(m.user?._id || m.user);
      return mid !== String(userId) && m.role === "owner";
    });
    if (oldOwner) {
      await ProjectDB.updateMember(req.project._id, String(oldOwner.user?._id || oldOwner.user), "admin");
    }
  }

  const project = await ProjectDB.updateMember(req.project._id, userId, role);

  await ActivityDB.create({
    project: req.project._id,
    user: req.user._id,
    action: "updated",
    description: `${req.user.name} changed a member's role to ${role}`,
  });

  res.json({
    success: true,
    data: { project: publicProject(project, req.user._id, req.user.role || req.user.systemRole) },
  });
});
