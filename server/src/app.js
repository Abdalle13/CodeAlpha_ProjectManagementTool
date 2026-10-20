import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import healthRouter from "./routes/health.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

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

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
