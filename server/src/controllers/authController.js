import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidEmail, normalizeEmail, publicUser } from "../utils/sanitize.js";
import { clearAuthCookie, setAuthCookie, signAuthToken } from "../utils/tokens.js";

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

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
    data: { user: publicUser(user), token },
  });
});

export const login = asyncHandler(async (req, res) => {
  const loginInput = String(req.body?.email || req.body?.username || req.body?.login || "").trim();
  const password = req.body?.password;

  if (!loginInput || typeof password !== "string" || !password) {
    throw new AppError("Enter your username or email and password.", 400, "VALIDATION_ERROR");
  }

  const isEmail = isValidEmail(loginInput);
  const query = isEmail
    ? { email: normalizeEmail(loginInput) }
    : { name: { $regex: new RegExp(`^${escapeRegex(loginInput)}$`, "i") } };

  const user = await User.findOne(query).select("+passwordHash");
  if (!user) {
    throw new AppError(
      isEmail
        ? "No account found with this email address."
        : "No account found with this username.",
      404,
      "NOT_FOUND"
    );
  }
  if (!user.isActive) {
    throw new AppError("This account has been deactivated. Please contact support.", 401, "ACCOUNT_INACTIVE");
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new AppError("Incorrect password. Please try again.", 401, "UNAUTHORIZED");
  }

  const token = signAuthToken(user.id);
  setAuthCookie(res, token);

  res.json({
    success: true,
    data: { user: publicUser(user), token },
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

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError("Enter your current and new password.", 400, "VALIDATION_ERROR");
  }
  validatePassword(newPassword);

  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new AppError("Current password does not match.", 400, "INVALID_PASSWORD");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({
    success: true,
    data: { message: "Password updated successfully." },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, title } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  if (name !== undefined) user.name = validateName(name);
  if (title !== undefined) user.title = String(title).trim().slice(0, 50);

  await user.save();

  res.json({
    success: true,
    data: { user: publicUser(user) },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Please provide an email address.", 400, "VALIDATION_ERROR");
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new AppError("Please enter a valid email address (e.g. johndoe@gmail.com).", 400, "VALIDATION_ERROR");
  }

  // Real database check: verify user actually exists
  const user = await User.findOne({ email: trimmedEmail });
  if (!user) {
    throw new AppError("No account found with this email address. Please make sure you are registered.", 404, "NOT_FOUND");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken = tokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetToken,
      userName: user.name,
    });
  } catch (err) {
    console.error("Failed to send reset email:", err);
    throw new AppError("Failed to deliver reset email. Please verify email settings or try again.", 500, "EMAIL_ERROR");
  }

  res.json({
    success: true,
    message: `A password reset link has been sent to ${user.email}. Check your inbox!`,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) {
    throw new AppError("Token, email, and new password are required.", 400, "VALIDATION_ERROR");
  }

  validatePassword(password);
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires +passwordHash");

  if (!user) {
    throw new AppError("Password reset link is invalid or has expired.", 400, "INVALID_TOKEN");
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successful! You can now sign in with your new password.",
  });
});
