import mongoose from "mongoose";
import { Project } from "../models/Project.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const loadAccessibleProject = asyncHandler(async (req, _res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Project not found.", 404, "NOT_FOUND");
  }

  const project = await Project.findById(id)
    .populate("owner", "name email")
    .populate("members.user", "name email");

  const membership = project?.members.find((member) => member.user?._id?.equals(req.user._id)) ||
    (project && req.user.systemRole === "admin" ? { user: req.user, role: "admin" } : null);
  if (!project || !membership) {
    throw new AppError("Project not found.", 404, "NOT_FOUND");
  }

  req.project = project;
  req.membership = membership;
  next();
});

export function requireProjectRole(...roles) {
  return (req, _res, next) => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      throw new AppError("You do not have permission to do that.", 403, "FORBIDDEN");
    }
    next();
  };
}
