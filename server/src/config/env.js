import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function readEnv(name, fallback = "") {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

export const env = {
  get nodeEnv() {
    return readEnv("NODE_ENV", "development");
  },
  get port() {
    return Number(readEnv("PORT", "5000"));
  },
  get clientOrigin() {
    return readEnv("CLIENT_ORIGIN", "http://localhost:5173");
  },
  get mongodbUri() {
    return readEnv("MONGODB_URI", "");
  },
  get jwtSecret() {
    return readEnv("JWT_SECRET", "");
  },
  get jwtExpiresIn() {
    return readEnv("JWT_EXPIRES_IN", "7d");
  },
  get cookieSecure() {
    return readEnv("COOKIE_SECURE", "false") === "true";
  },
  get authCookieName() {
    return readEnv("AUTH_COOKIE_NAME", "taskora_token");
  },
};

export function isProduction() {
  return env.nodeEnv === "production";
}

export function isTest() {
  return env.nodeEnv === "test";
}
