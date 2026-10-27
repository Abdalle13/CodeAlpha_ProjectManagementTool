import { AppError } from "./AppError.js";

export function parsePagination(query, maxLimit = 100) {
  const parsedPage = query.page === undefined ? 1 : Number(query.page);
  let parsedLimit = query.limit === undefined ? 12 : Number(query.limit);
  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    throw new AppError("Page must be a positive integer.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    throw new AppError("Limit must be a positive integer.", 400, "VALIDATION_ERROR");
  }
  if (parsedLimit > maxLimit) {
    parsedLimit = maxLimit;
  }
  const page = parsedPage;
  const limit = parsedLimit;
  return { page, limit, skip: (page - 1) * limit };
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
