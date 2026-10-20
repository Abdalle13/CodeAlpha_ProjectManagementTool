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
  nodeEnv: readEnv("NODE_ENV", "development"),
  port: Number(readEnv("PORT", "5000")),
  clientOrigin: readEnv("CLIENT_ORIGIN", "http://localhost:5173"),
  mongodbUri: readEnv("MONGODB_URI", ""),
  jwtSecret: readEnv("JWT_SECRET", ""),
  jwtExpiresIn: readEnv("JWT_EXPIRES_IN", "7d"),
  cookieSecure: readEnv("COOKIE_SECURE", "false") === "true",
};

export const isProduction = env.nodeEnv === "production";
export const isTest = env.nodeEnv === "test";
