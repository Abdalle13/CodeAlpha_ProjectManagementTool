import { Router } from "express";
import { getDatabaseStatus } from "../config/db.js";

const router = Router();

router.get("/", (_req, res) => {
  const database = getDatabaseStatus();

  res.json({
    success: true,
    data: {
      service: "taskora-api",
      status: "ok",
      timestamp: new Date().toISOString(),
      database,
    },
  });
});

export default router;
