import mongoose from "mongoose";
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

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const q = String(req.query.q || "").trim();
  const roleFilter = req.query.role;
  const statusFilter = req.query.status;

  const filter = {};
  if (q) {
    const escaped = escapeRegex(q);
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { department: { $regex: escaped, $options: "i" } },
    ];
  }
  if (roleFilter && ["admin", "manager", "member"].includes(roleFilter)) {
    filter.role = roleFilter;
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
  const { role, department } = req.body;

  if (!["admin", "manager", "member"].includes(role)) {
    throw new AppError("Invalid role specified.", 400, "VALIDATION_ERROR");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  if (user.role === "admin" && role !== "admin") {
    const adminCount = await User.countDocuments({ role: "admin", isActive: true });
    if (adminCount <= 1) {
      throw new AppError("Cannot demote the last remaining active administrator.", 400, "OPERATION_NOT_ALLOWED");
    }
  }

  user.role = role;
  if (department) user.department = String(department).trim();
  await user.save();

  res.json({
    success: true,
    data: { user: publicUser(user) },
  });
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

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    data: { user: publicUser(user) },
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
      .populate("owner", "name email role department avatarColor")
      .populate("members.user", "name email role department avatarColor")
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

export const getSystemStats = asyncHandler(async (_req, res) => {
  const [totalUsers, activeUsers, totalProjects, totalTasks, completedTasks] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    Project.countDocuments({}),
    Task.countDocuments({}),
    Task.countDocuments({ status: "completed" }),
  ]);

  const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(5).select("name email role department createdAt");
  const recentActivities = await Activity.find({}).sort({ createdAt: -1 }).limit(10).populate("user", "name email").populate("project", "name key");

  res.json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        activeUsers,
        totalProjects,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      recentUsers: recentUsers.map(publicUser),
      recentActivities,
    },
  });
});
