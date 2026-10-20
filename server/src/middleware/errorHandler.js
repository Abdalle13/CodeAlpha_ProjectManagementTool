import { isProduction } from "../config/env.js";

export function errorHandler(err, _req, res, _next) {
  const status = Number(err.status || err.statusCode) || 500;
  const message =
    status >= 500 && isProduction
      ? "An unexpected error occurred."
      : err.message || "An unexpected error occurred.";

  if (!isProduction) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      code: err.code || (status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
    },
  });
}
