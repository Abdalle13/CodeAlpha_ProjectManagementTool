import { Router } from "express";
import { listAccessibleTasks } from "../controllers/taskController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.get("/", requireAuth, listAccessibleTasks);

export default router;