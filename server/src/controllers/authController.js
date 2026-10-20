import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidEmail, normalizeEmail, publicUser } from "../utils/sanitize.js";
import { clearAuthCookie, setAuthCookie, signAuthToken } from "../utils/tokens.js";

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new AppError("Password must be between 8 and 72 characters.", 400, "VALIDATION_ERROR");
  }
}

function validateName(name) {
  const trimmed = String(name || "").trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    throw new AppError("Enter a name between 2 and 80 characters.", 400, "VALIDATION_ERROR");
  }
  return trimmed;
}

export const register = asyncHandler(async (req, res) => {
  const name = validateName(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!isValidEmail(email)) {
    throw new AppError("Enter a valid email address.", 400, "VALIDATION_ERROR");
  }
  validatePassword(password);

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409, "CONFLICT");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  const token = signAuthToken(user.id);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    data: { user: publicUser(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!isValidEmail(email) || typeof password !== "string" || !password) {
    throw new AppError("Enter a valid email and password.", 400, "VALIDATION_ERROR");
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !matches) {
    throw new AppError("Invalid email or password.", 401, "UNAUTHORIZED");
  }

  const token = signAuthToken(user.id);
  setAuthCookie(res, token);

  res.json({
    success: true,
    data: { user: publicUser(user) },
  });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    data: { user: null },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: publicUser(req.user) },
  });
});
