import { AppError } from "../utils/AppError.js";

export function requireSystemAdmin(req, _res, next) {
  const role = req.user?.role || req.user?.systemRole;
  if (role !== "admin") {
    throw new AppError("Administrator access is required.", 403, "FORBIDDEN");
  }
  next();
}
