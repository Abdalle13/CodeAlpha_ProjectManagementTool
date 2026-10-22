import { AppError } from "./AppError.js";

export function parsePagination(query) {
  const parsedPage = query.page === undefined ? 1 : Number(query.page);
  const parsedLimit = query.limit === undefined ? 12 : Number(query.limit);
  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    throw new AppError("Page must be a positive integer.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
    throw new AppError("Limit must be an integer between 1 and 50.", 400, "VALIDATION_ERROR");
  }
  const page = parsedPage;
  const limit = parsedLimit;
  return { page, limit, skip: (page - 1) * limit };
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
