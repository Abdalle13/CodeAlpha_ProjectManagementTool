import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env, isProduction } from "./config/env.js";
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
        if (env.allowedOrigins.includes(cleanOrigin) || !isProduction()) {
          return callback(null, true);
        }
        return callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(originGuard);

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
