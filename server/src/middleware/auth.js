import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAuthToken } from "../utils/tokens.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.authCookieName];
  if (!token) {
    throw new AppError("Please sign in to continue.", 401, "UNAUTHORIZED");
  }

  const payload = verifyAuthToken(token);
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError("Please sign in to continue.", 401, "UNAUTHORIZED");
  }

  req.user = user;
  next();
});
