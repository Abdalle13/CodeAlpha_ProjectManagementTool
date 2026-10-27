import bcrypt from "bcryptjs";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { UserDB, ProjectDB, TaskDB, CommentDB, ActivityDB } from "../models/db.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination } from "../utils/pagination.js";
import { publicProject } from "../utils/projectView.js";
import { publicUser } from "../utils/sanitize.js";

export const bootstrapSystemAdmin = asyncHandler(async (req, res) => {
  const suppliedToken = req.body?.token;
  const expectedToken = env.systemAdminBootstrapToken || process.env.SYSTEM_ADMIN_BOOTSTRAP_TOKEN;
  if (!expectedToken || typeof suppliedToken !== "string") {
    throw new AppError("System admin bootstrap is not configured.", 403, "FORBIDDEN");
  }
  const suppliedBuffer = Buffer.from(suppliedToken);
  const expectedBuffer = Buffer.from(expectedToken);
  const tokenMatches =
    suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
  const expectedEmail = env.systemAdminEmail || process.env.SYSTEM_ADMIN_EMAIL;
  if (!tokenMatches || (expectedEmail && req.user.email !== expectedEmail)) {
    throw new AppError("Admin bootstrap is not authorized.", 403, "FORBIDDEN");
  }
  if (req.user.systemRole === "admin" || req.user.role === "admin") {
    throw new AppError("System administration has already been initialized.", 409, "CONFLICT");
  }

  const updated = await UserDB.update(req.user._id, {
    systemRole: "admin",
    role: "admin",
  });
  res.json({ success: true, data: { user: publicUser(updated) } });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const q = String(req.query.q || "").trim();
  if (q.length > 100) {
    throw new AppError("Search query must be 100 characters or fewer.", 400, "VALIDATION_ERROR");
  }
  const roleFilter = req.query.role;
  const statusFilter = req.query.status;

  const { items, total } = await UserDB.findPaginated({
    search: q,
    role: roleFilter,
    status: statusFilter,
    page,
    limit,
  });

  res.json({
    success: true,
    data: {
      items: items.map(publicUser),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!["admin", "manager", "member", "user"].includes(role)) {
    throw new AppError("Invalid role specified.", 400, "VALIDATION_ERROR");
  }

  const user = await UserDB.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  if ((user.role === "admin" || user.systemRole === "admin") && role !== "admin") {
    const adminCount = await UserDB.countAdmins();
    if (adminCount <= 1) {
      throw new AppError("Cannot demote the last remaining active administrator.", 400, "OPERATION_NOT_ALLOWED");
    }
  }

  const updated = await UserDB.update(userId, {
    role,
    systemRole: role === "admin" ? "admin" : "user",
  });

  res.json({
    success: true,
    data: { user: publicUser(updated) },
  });
});

export const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = "user", systemRole, title, isActive = true } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    throw new AppError("Name must be at least 2 characters.", 400, "VALIDATION_ERROR");
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AppError("A valid email address is required.", 400, "VALIDATION_ERROR");
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    throw new AppError("Password must be at least 6 characters.", 400, "VALIDATION_ERROR");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await UserDB.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError("An account with this email address already exists.", 409, "CONFLICT");
  }

  const assignedRole = role || (systemRole === "admin" ? "admin" : "user");
  if (!["admin", "manager", "member", "user"].includes(assignedRole)) {
    throw new AppError("Invalid role specified.", 400, "VALIDATION_ERROR");
  }

  const assignedSystemRole = assignedRole === "admin" || systemRole === "admin" ? "admin" : "user";
  const passwordHash = await bcrypt.hash(password, 12);

  const colors = ["#4f6ef7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const user = await UserDB.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: assignedRole,
    systemRole: assignedSystemRole,
    title: title ? String(title).trim() : assignedRole === "admin" ? "System Administrator" : "Team Member",
    avatarColor: randomColor,
    isActive: Boolean(isActive),
  });

  res.status(201).json({
    success: true,
    data: { user: publicUser(user) },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, email, systemRole, role, isActive, title, password } = req.body || {};

  const user = await UserDB.findById(userId);
  if (!user) throw new AppError("User not found.", 404, "NOT_FOUND");

  const updates = {};

  // Name validation & update
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      throw new AppError("Name must be at least 2 characters.", 400, "VALIDATION_ERROR");
    }
    updates.name = name.trim();
  }

  // Email validation & update
  if (email !== undefined) {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new AppError("A valid email address is required.", 400, "VALIDATION_ERROR");
    }
    if (normalized !== user.email) {
      const existing = await UserDB.findOne({ email: normalized });
      if (existing && String(existing._id) !== String(user._id)) {
        throw new AppError("Email is already taken by another account.", 409, "CONFLICT");
      }
      updates.email = normalized;
    }
  }

  const targetRole = systemRole || role;
  if (targetRole !== undefined && !["user", "admin", "manager", "member"].includes(targetRole)) {
    throw new AppError("Choose a valid system role.", 400, "VALIDATION_ERROR");
  }

  const deactivatingAdmin =
    user.isActive &&
    (user.systemRole === "admin" || user.role === "admin") &&
    ((targetRole && targetRole !== "admin") || isActive === false);

  if (deactivatingAdmin) {
    const activeAdminCount = await UserDB.countAdmins();
    if (activeAdminCount <= 1) {
      throw new AppError("The last active system admin cannot be demoted or deactivated.", 400, "VALIDATION_ERROR");
    }
  }

  if (targetRole !== undefined) {
    updates.systemRole = targetRole === "admin" ? "admin" : "user";
    updates.role = targetRole;
  }
  if (isActive !== undefined) {
    updates.isActive = Boolean(isActive);
  }
  if (title !== undefined) {
    updates.title = String(title).trim();
  }
  if (password && typeof password === "string" && password.trim().length >= 6) {
    updates.passwordHash = await bcrypt.hash(password.trim(), 12);
  }

  const updated = await UserDB.update(userId, updates);
  res.json({ success: true, data: { user: publicUser(updated) } });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (String(req.user._id) === String(userId)) {
    throw new AppError("You cannot deactivate your own administrative account.", 400, "OPERATION_NOT_ALLOWED");
  }

  const user = await UserDB.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  if (user.isActive && (user.systemRole === "admin" || user.role === "admin")) {
    const activeAdminCount = await UserDB.countAdmins();
    if (activeAdminCount <= 1) {
      throw new AppError("The last active system admin cannot be deactivated.", 400, "OPERATION_NOT_ALLOWED");
    }
  }

  const updated = await UserDB.update(userId, { isActive: !user.isActive });

  res.json({
    success: true,
    data: { user: publicUser(updated) },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (String(req.user._id) === String(userId)) {
    throw new AppError("You cannot delete your own account.", 400, "OPERATION_NOT_ALLOWED");
  }

  const user = await UserDB.findById(userId);
  if (!user) throw new AppError("User not found.", 404, "NOT_FOUND");

  if (user.systemRole === "admin" || user.role === "admin") {
    const activeAdminCount = await UserDB.countAdmins();
    if (activeAdminCount <= 1) {
      throw new AppError("Cannot delete the last remaining active administrator.", 400, "OPERATION_NOT_ALLOWED");
    }
  }

  // Remove references in project members
  await ProjectDB.removeUserFromAllProjects(userId);

  // Unassign tasks assigned to this user
  await TaskDB.unassignUser(userId);

  await UserDB.delete(userId);

  res.json({
    success: true,
    data: { message: "User account permanently deleted." },
  });
});

export const listAllProjects = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const q = String(req.query.q || "").trim();

  const { items, total } = await ProjectDB.findAllAdmin({ search: q, page, limit });

  res.json({
    success: true,
    data: {
      items: items.map((p) => publicProject(p, req.user._id, "admin")),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const deleteAnyProject = asyncHandler(async (req, res) => {
  const project = await ProjectDB.findById(req.params.projectId);
  if (!project) throw new AppError("Project not found.", 404, "NOT_FOUND");
  await TaskDB.deleteMany({ project_id: project._id });
  await CommentDB.deleteMany({ project_id: project._id });
  await ActivityDB.deleteMany({ project_id: project._id });
  await ProjectDB.delete(project._id);
  res.json({ success: true, data: { project: null } });
});

export const getSystemStats = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalProjects,
    totalTasks,
    completedTasks,
    projectStatusCounts,
    taskStatusCounts,
    taskPriorityCounts,
    roleCounts,
  ] = await Promise.all([
    UserDB.countDocuments({}),
    UserDB.countDocuments({ isActive: true }),
    ProjectDB.countDocuments({}),
    TaskDB.countDocuments({}),
    TaskDB.countDocuments({ statuses: ["completed", "done"] }),
    ProjectDB.getGroupedStatusCounts(),
    TaskDB.getGroupedStatusCounts(),
    TaskDB.getGroupedPriorityCounts(),
    UserDB.getGroupedRoleCounts(),
  ]);

  const recentUsers = await UserDB.getRecentUsers(6);
  const recentActivities = await ActivityDB.getRecent(10);

  res.json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        activeUsers,
        inactiveUsers: Math.max(0, totalUsers - activeUsers),
        totalProjects,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      charts: {
        projectStatus: projectStatusCounts.map((c) => ({
          status: c.status || "active",
          count: c.count,
        })),
        taskStatus: taskStatusCounts.map((c) => ({
          status: c.status || "todo",
          count: c.count,
        })),
        taskPriority: taskPriorityCounts.map((c) => ({
          priority: c.priority || "medium",
          count: c.count,
        })),
        userRoles: roleCounts.map((c) => ({
          role: c.role || "user",
          count: c.count,
        })),
      },
      recentUsers: recentUsers.map(publicUser),
      recentActivities,
    },
  });
});

export const listSystemActivities = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { items, total } = await ActivityDB.findAll({ page, limit });

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});
