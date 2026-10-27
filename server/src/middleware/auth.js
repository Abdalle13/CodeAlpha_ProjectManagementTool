import { env } from "../config/env.js";
import { UserDB } from "../models/db.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAuthToken } from "../utils/tokens.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = req.cookies?.[env.authCookieName] || bearerToken;

  if (!token) {
    throw new AppError("Please sign in to continue.", 401, "UNAUTHORIZED");
  }

  const payload = verifyAuthToken(token);
  const user = await UserDB.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new AppError("Please sign in to continue.", 401, "UNAUTHORIZED");
  }

  req.user = user;
  next();
});

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
    }
    const userRole = req.user.role || req.user.systemRole || "member";
    if (!allowedRoles.includes(userRole)) {
      throw new AppError("You do not have permission to perform this action.", 403, "FORBIDDEN");
    }
    next();
  };
}
