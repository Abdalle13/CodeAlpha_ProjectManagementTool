import { env, isProduction } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function originGuard(req, _res, next) {
  if (!unsafeMethods.has(req.method)) return next();

  const origin = req.get("origin");
  const allowed = env.allowedOrigins;
  if (origin) {
    const cleanOrigin = origin.trim().replace(/\/+$/, "");
    if (allowed.length === 0 || allowed.includes(cleanOrigin)) {
      return next();
    }
    try {
      const parsed = new URL(cleanOrigin);
      if (parsed.hostname.endsWith(".vercel.app") || parsed.hostname.endsWith(".netlify.app") || parsed.hostname === "localhost") {
        return next();
      }
    } catch {
      // ignore
    }
    throw new AppError("Request origin is not allowed.", 403, "FORBIDDEN");
  }
  if (isProduction() && allowed.length > 0 && !origin) {
    throw new AppError("A request origin is required.", 403, "FORBIDDEN");
  }
  next();
}