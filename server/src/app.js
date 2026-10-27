import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env, isProduction, validateProductionEnv } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import projectRouter from "./routes/projects.js";
import taskRouter from "./routes/tasks.js";
import adminRouter from "./routes/admin.js";
import collaborationRouter from "./routes/collaboration.js";
import dashboardRouter from "./routes/dashboard.js";
import usersRouter from "./routes/users.js";
import taskCollectionRouter from "./routes/taskCollection.js";
import activityRouter from "./routes/activity.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { originGuard } from "./middleware/originGuard.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  if (isProduction()) {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        const cleanOrigin = requestOrigin.trim().replace(/\/+$/, "");
        const allowed = env.allowedOrigins;
        if (allowed.length === 0 || allowed.includes(cleanOrigin) || !isProduction()) {
          return callback(null, true);
        }
        try {
          const parsed = new URL(cleanOrigin);
          if (parsed.hostname.endsWith(".vercel.app") || parsed.hostname.endsWith(".netlify.app") || parsed.hostname === "localhost") {
            return callback(null, true);
          }
        } catch {
          // ignore
        }
        return callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(originGuard);

  app.get("/favicon.ico", (_req, res) => res.status(204).end());
  app.get("/favicon.png", (_req, res) => res.status(204).end());

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      data: {
        name: "Taskora API",
        tagline: "Plan projects. Manage tasks. Work together.",
      },
    });
  });

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/projects", projectRouter);
  app.use("/api/tasks", taskCollectionRouter);
  app.use("/api/projects/:id/tasks", taskRouter);
  app.use("/api/projects/:id", collaborationRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/activity", activityRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

// Default export for Vercel Serverless Function entrypoint
let connectionPromise;
const defaultApp = createApp();

export default async function handler(request, response) {
  const url = request.url || "";
  if (url === "/favicon.ico" || url === "/favicon.png") {
    response.statusCode = 204;
    return response.end();
  }

  try {
    if (isProduction()) validateProductionEnv();

    connectionPromise ||= connectDatabase().catch((err) => {
      connectionPromise = undefined;
      throw err;
    });

    if (url === "/" || url === "/api/health") {
      // Allow root ping and health check to respond with current status without blocking
      connectionPromise.catch((err) => console.warn("Database connection issue during status ping:", err.message));
    } else {
      await connectionPromise;
    }

    return defaultApp(request, response);
  } catch (error) {
    console.error("Taskora API initialization failed:", error.message);
    return response.status(503).json({
      success: false,
      error: { message: error.message || "API is temporarily unavailable.", code: "SERVICE_UNAVAILABLE" },
    });
  }
}
