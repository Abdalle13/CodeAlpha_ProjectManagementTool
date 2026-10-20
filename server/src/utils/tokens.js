import jwt from "jsonwebtoken";
import { env, isProduction } from "../config/env.js";
import { AppError } from "./AppError.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function requireSecret() {
  if (!env.jwtSecret || env.jwtSecret.length < 16) {
    throw new AppError("Authentication is not configured.", 500, "CONFIG_ERROR");
  }
  return env.jwtSecret;
}

export function signAuthToken(userId) {
  return jwt.sign({ sub: String(userId) }, requireSecret(), {
    expiresIn: env.jwtExpiresIn,
  });
}

export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, requireSecret());
  } catch {
    throw new AppError("Your session is invalid or has expired.", 401, "UNAUTHORIZED");
  }
}

export function cookieOptions() {
  const secure = env.cookieSecure || isProduction();
  const maxAge = env.jwtExpiresIn.endsWith("d")
    ? Number(env.jwtExpiresIn.slice(0, -1)) * DAY_MS
    : 7 * DAY_MS;

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge,
  };
}

export function setAuthCookie(res, token) {
  res.cookie(env.authCookieName, token, cookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie(env.authCookieName, {
    ...cookieOptions(),
    maxAge: 0,
  });
}
