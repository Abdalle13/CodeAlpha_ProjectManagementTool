import { isProduction } from "../config/env.js";

export function errorHandler(err, _req, res, _next) {
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        message: "An account with this email already exists.",
        code: "CONFLICT",
      },
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: {
        message: "A submitted identifier was not valid.",
        code: "VALIDATION_ERROR",
      },
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: {
        message: "Request body must be valid JSON.",
        code: "VALIDATION_ERROR",
      },
    });
  }

  const status = Number(err.status || err.statusCode) || 500;
  console.error(`[API Error ${status}]:`, err?.stack || err);
  const message = err.message || "An unexpected error occurred.";

  res.status(status).json({
    success: false,
    error: {
      message,
      code: err.code || (status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
    },
  });
}
