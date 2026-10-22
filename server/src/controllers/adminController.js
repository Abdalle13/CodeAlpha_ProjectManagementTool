import mongoose from "mongoose";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { Comment } from "../models/Comment.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination } from "../utils/pagination.js";
import { publicProject } from "../utils/projectView.js";
import { publicUser } from "../utils/sanitize.js";

export const bootstrapSystemAdmin = asyncHandler(async (req, res) => {
  const suppliedToken = req.body?.token;
  const expectedToken = env.systemAdminBootstrapToken;
  if (!expectedToken || typeof suppliedToken !== "string") {
    throw new AppError("System admin bootstrap is not configured.", 403, "FORBIDDEN");
  }
  const suppliedBuffer = Buffer.from(suppliedToken);
  const expectedBuffer = Buffer.from(expectedToken);
  const tokenMatches = suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
  if (!tokenMatches || !env.systemAdminEmail || req.user.email !== env.systemAdminEmail) {
    throw new AppError("Admin bootstrap is not authorized.", 403, "FORBIDDEN");
  }
  if (await User.countDocuments({ systemRole: "admin" })) {
    throw new AppError("System administration has already been initialized.", 409, "CONFLICT");
  }

  req.user.systemRole = "admin";
  await req.user.save();
  res.json({ success: true, data: { user: publicUser(req.user) } });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const q = String(req.query.q || "").trim();
  if (q.length > 100) {
    throw new AppError("Search query must be 100 characters or fewer.", 400, "VALIDATION_ERROR");
  }
  const filter = q
    ? { $or: [{ name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }, { email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }] }
    : {};
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

export const listAllProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [projects, total] = await Promise.all([
    Project.find().sort({ updatedAt: -1 }).skip(skip).limit(limit)
      .populate("owner", "name email")
      .populate("members.user", "name email"),
    Project.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      items: projects.map((project) => publicProject(project, req.user._id, req.user.systemRole)),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }
  const { systemRole, isActive } = req.body || {};
  if (systemRole === undefined && isActive === undefined) {
    throw new AppError("Provide a system role or account status to update.", 400, "VALIDATION_ERROR");
  }
  if (systemRole !== undefined && !["user", "admin"].includes(systemRole)) {
    throw new AppError("Choose a valid system role.", 400, "VALIDATION_ERROR");
  }
  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw new AppError("Account status must be true or false.", 400, "VALIDATION_ERROR");
  }

  const user = await User.findById(req.params.userId);
  if (!user) throw new AppError("User not found.", 404, "NOT_FOUND");
  const deactivatingAdmin = user.isActive && user.systemRole === "admin" && (systemRole === "user" || isActive === false);
  if (deactivatingAdmin) {
    const activeAdminCount = await User.countDocuments({ systemRole: "admin", isActive: true });
    if (activeAdminCount <= 1) {
      throw new AppError("The last active system admin cannot be demoted or deactivated.", 400, "VALIDATION_ERROR");
    }
  }

  if (systemRole !== undefined) user.systemRole = systemRole;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();
  res.json({ success: true, data: { user: publicUser(user) } });
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