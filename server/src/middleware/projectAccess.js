import { ProjectDB } from "../models/db.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const loadAccessibleProject = asyncHandler(async (req, _res, next) => {
  const { id } = req.params;
  if (!id) {
    throw new AppError("Project not found.", 404, "NOT_FOUND");
  }

  const project = await ProjectDB.findById(id);

  const membership =
    project?.members.find((member) => {
      const memberUserId = member.user?._id || member.user?.id || member.user;
      return String(memberUserId) === String(req.user._id || req.user.id);
    }) ||
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
