import { env } from "../config/env.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function originGuard(req, _res, next) {
  if (!unsafeMethods.has(req.method)) return next();

  const origin = req.get("origin");
  if (!origin) {
    return next();
  }

  const cleanOrigin = origin.trim().replace(/\/+$/, "");
  const allowed = env.allowedOrigins;

  if (allowed.length === 0 || allowed.includes("*") || allowed.includes(cleanOrigin)) {
    return next();
  }

  try {
    const parsed = new URL(cleanOrigin);
    if (
      parsed.hostname.endsWith(".vercel.app") ||
      parsed.hostname.endsWith(".netlify.app") ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1"
    ) {
      return next();
    }
  } catch {
    // ignore
  }

  return next();
}
