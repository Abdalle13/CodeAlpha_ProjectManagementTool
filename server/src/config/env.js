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
    return readEnv("CLIENT_ORIGIN", "http://localhost:5173").trim().replace(/\/+$/, "");
  },
  get allowedOrigins() {
    const raw = readEnv("CLIENT_ORIGIN", "http://localhost:5173");
    return raw
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .filter(Boolean);
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
  get systemAdminEmail() {
    return readEnv("SYSTEM_ADMIN_EMAIL", "").trim().toLowerCase();
  },
  get systemAdminBootstrapToken() {
    return readEnv("SYSTEM_ADMIN_BOOTSTRAP_TOKEN", "");
  },
};

export function isProduction() {
  return env.nodeEnv === "production";
}

export function isTest() {
  return env.nodeEnv === "test";
}

export function validateProductionEnv() {
  const missing = [];
  if (!env.mongodbUri) missing.push("MONGODB_URI");
  if (env.jwtSecret.length < 32 || env.jwtSecret.startsWith("replace-with")) {
    missing.push("JWT_SECRET (at least 32 characters)");
  }
  const origins = env.allowedOrigins;
  const invalidOrigin = origins.some((o) => !o.startsWith("https://") || o.includes("localhost"));
  if (origins.length === 0 || invalidOrigin) {
    missing.push("CLIENT_ORIGIN (HTTPS deployed frontend origin, e.g. https://your-site.netlify.app)");
  }
  if (missing.length) {
    throw new Error(`Production environment is incomplete: ${missing.join(", ")}`);
  }
}
