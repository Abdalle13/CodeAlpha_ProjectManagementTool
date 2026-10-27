import { env, isProduction } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function originGuard(req, _res, next) {
  if (!unsafeMethods.has(req.method)) return next();

  const origin = req.get("origin");
  const allowed = env.allowedOrigins;
  if (origin && allowed.length > 0) {
    const cleanOrigin = origin.trim().replace(/\/+$/, "");
    if (!allowed.includes(cleanOrigin)) {
      throw new AppError("Request origin is not allowed.", 403, "FORBIDDEN");
    }
  }
  if (isProduction() && allowed.length > 0 && !origin) {
    throw new AppError("A request origin is required.", 403, "FORBIDDEN");
  }
  next();
}