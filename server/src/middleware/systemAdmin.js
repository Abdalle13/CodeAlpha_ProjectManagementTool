import { AppError } from "../utils/AppError.js";

export function requireSystemAdmin(req, _res, next) {
  if (req.user?.systemRole !== "admin") {
    throw new AppError("System administrator access is required.", 403, "FORBIDDEN");
  }
  next();
}