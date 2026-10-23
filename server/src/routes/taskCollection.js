import { Router } from "express";
import { listAllAccessibleTasks, updateTaskStatus, getTask } from "../controllers/taskController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listAllAccessibleTasks);
router.get("/:taskId", getTask);
router.patch("/:taskId/status", updateTaskStatus);

export default router;
