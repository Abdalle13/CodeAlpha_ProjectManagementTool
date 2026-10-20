import rateLimit from "express-rate-limit";
import { isTest } from "../config/env.js";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    error: {
      message: "Too many authentication attempts. Try again in a few minutes.",
      code: "RATE_LIMITED",
    },
  },
});

export function authLimiter(req, res, next) {
  if (isTest()) {
    return next();
  }
  return limiter(req, res, next);
}
