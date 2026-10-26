import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { Comment } from "../models/Comment.js";
import { Activity } from "../models/Activity.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination, escapeRegex } from "../utils/pagination.js";
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

  req.user.systemRole = "admin";
  req.user.role = "admin";
  await req.user.save();
  res.json({ success: true, data: { user: publicUser(req.user) } });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const q = String(req.query.q || "").trim();
  if (q.length > 100) {
    throw new AppError("Search query must be 100 characters or fewer.", 400, "VALIDATION_ERROR");
  }
  const roleFilter = req.query.role;
  const statusFilter = req.query.status;

  const filter = {};
  if (q) {
    const escaped = escapeRegex(q);
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }
  if (roleFilter && ["admin", "manager", "member", "user"].includes(roleFilter)) {
    filter.$or = [{ role: roleFilter }, { systemRole: roleFilter }];
  }
  if (statusFilter === "active") filter.isActive = true;
  if (statusFilter === "inactive") filter.isActive = false;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: users.map(publicUser),
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

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  if ((user.role === "admin" || user.systemRole === "admin") && role !== "admin") {
    const adminCount = await User.countDocuments({
      $or: [{ role: "admin" }, { systemRole: "admin" }],
      isActive: true,
    });
    if (adminCount <= 1) {
      throw new AppError("Cannot demote the last remaining active administrator.", 400, "OPERATION_NOT_ALLOWED");
    }
  }

  user.role = role;
  user.systemRole = role === "admin" ? "admin" : "user";
  await user.save();

  res.json({
    success: true,
    data: { user: publicUser(user) },
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
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError("An account with this email address already exists.", 409, "CONFLICT");
  }

  const assignedRole = role || (systemRole === "admin" ? "admin" : "user");
  if (!["admin", "manager", "member", "user"].includes(assignedRole)) {
    throw new AppError("Invalid role specified.", 400, "VALIDATION_ERROR");
  }

  const assignedSystemRole = (assignedRole === "admin" || systemRole === "admin") ? "admin" : "user";
  const passwordHash = await bcrypt.hash(password, 12);

  const colors = ["#4f6ef7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: assignedRole,
    systemRole: assignedSystemRole,
    title: title ? String(title).trim() : (assignedRole === "admin" ? "System Administrator" : "Team Member"),
    avatarColor: randomColor,
    isActive: Boolean(isActive),
  });

  res.status(201).json({
    success: true,
    data: { user: publicUser(user) },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }
  const { name, email, systemRole, role, isActive, title, password } = req.body || {};

  const user = await User.findById(req.params.userId);
  if (!user) throw new AppError("User not found.", 404, "NOT_FOUND");

  // Name validation & update
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      throw new AppError("Name must be at least 2 characters.", 400, "VALIDATION_ERROR");
    }
    user.name = name.trim();
  }

  // Email validation & update
  if (email !== undefined) {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new AppError("A valid email address is required.", 400, "VALIDATION_ERROR");
    }
    if (normalized !== user.email) {
      const existing = await User.findOne({ email: normalized, _id: { $ne: user._id } });
      if (existing) {
        throw new AppError("Email is already taken by another account.", 409, "CONFLICT");
      }
      user.email = normalized;
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
    const activeAdminCount = await User.countDocuments({
      $or: [{ systemRole: "admin" }, { role: "admin" }],
      isActive: true,
    });
    if (activeAdminCount <= 1) {
      throw new AppError("The last active system admin cannot be demoted or deactivated.", 400, "VALIDATION_ERROR");
    }
  }

  if (targetRole !== undefined) {
    user.systemRole = targetRole === "admin" ? "admin" : "user";
    user.role = targetRole;
  }
  if (isActive !== undefined) {
    user.isActive = Boolean(isActive);
  }
  if (title !== undefined) {
    user.title = String(title).trim();
  }
  if (password && typeof password === "string" && password.trim().length >= 6) {
    user.passwordHash = await bcrypt.hash(password.trim(), 12);
  }

  await user.save();
  res.json({ success: true, data: { user: publicUser(user) } });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (String(req.user._id) === String(userId)) {
    throw new AppError("You cannot deactivate your own administrative account.", 400, "OPERATION_NOT_ALLOWED");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  if (user.isActive && (user.systemRole === "admin" || user.role === "admin")) {
    const activeAdminCount = await User.countDocuments({
      $or: [{ systemRole: "admin" }, { role: "admin" }],
      isActive: true,
    });
    if (activeAdminCount <= 1) {
      throw new AppError("The last active system admin cannot be deactivated.", 400, "OPERATION_NOT_ALLOWED");
    }
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    data: { user: publicUser(user) },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  if (String(req.user._id) === String(userId)) {
    throw new AppError("You cannot delete your own account.", 400, "OPERATION_NOT_ALLOWED");
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404, "NOT_FOUND");

  if (user.systemRole === "admin" || user.role === "admin") {
    const activeAdminCount = await User.countDocuments({
      $or: [{ systemRole: "admin" }, { role: "admin" }],
      isActive: true,
    });
    if (activeAdminCount <= 1) {
      throw new AppError("Cannot delete the last remaining active administrator.", 400, "OPERATION_NOT_ALLOWED");
    }
  }

  // Remove references in project members
  await Project.updateMany(
    { "members.user": user._id },
    { $pull: { members: { user: user._id } } }
  );

  // Unassign tasks assigned to this user
  await Task.updateMany(
    { assignee: user._id },
    { $unset: { assignee: "" } }
  );

  await user.deleteOne();

  res.json({
    success: true,
    data: { message: "User account permanently deleted." },
  });
});

export const listAllProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const q = String(req.query.q || "").trim();

  const filter = {};
  if (q) {
    const escaped = escapeRegex(q);
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { key: { $regex: escaped, $options: "i" } },
    ];
  }

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate("owner", "name email role avatarColor")
      .populate("members.user", "name email role avatarColor")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: projects.map((p) => publicProject(p, req.user._id, "admin")),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const deleteAnyProject = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.projectId)) {
    throw new AppError("Project not found.", 404, "NOT_FOUND");
  }
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new AppError("Project not found.", 404, "NOT_FOUND");
  await Task.deleteMany({ project: project._id });
  await Comment.deleteMany({ project: project._id });
  await Activity.deleteMany({ project: project._id });
  await project.deleteOne();
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
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    Project.countDocuments({}),
    Task.countDocuments({}),
    Task.countDocuments({ status: { $in: ["completed", "done"] } }),
    Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$systemRole", count: { $sum: 1 } } }]),
  ]);

  const recentUsers = await User.find({})
    .sort({ createdAt: -1 })
    .limit(6)
    .select("name email role systemRole createdAt isActive");

  const recentActivities = await Activity.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("user", "name email")
    .populate("actor", "name email")
    .populate("project", "name key");

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
          status: c._id || "active",
          count: c.count,
        })),
        taskStatus: taskStatusCounts.map((c) => ({
          status: c._id || "todo",
          count: c.count,
        })),
        taskPriority: taskPriorityCounts.map((c) => ({
          priority: c._id || "medium",
          count: c.count,
        })),
        userRoles: roleCounts.map((c) => ({
          role: c._id || "user",
          count: c.count,
        })),
      },
      recentUsers: recentUsers.map(publicUser),
      recentActivities,
    },
  });
});

export const listSystemActivities = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [activities, total] = await Promise.all([
    Activity.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("project", "name key")
      .populate("task", "title taskCode")
      .populate("actor", "name email")
      .populate("user", "name email"),
    Activity.countDocuments({}),
  ]);

  res.json({
    success: true,
    data: {
      items: activities,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});
