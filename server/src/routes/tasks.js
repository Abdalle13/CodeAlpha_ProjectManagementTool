import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  listProjectTasks,
  updateTask,
  updateTaskStatus,
  addChecklistItem,
  toggleChecklistItem,
} from "../controllers/taskController.js";
import { requireAuth } from "../middleware/auth.js";
import { loadAccessibleProject } from "../middleware/projectAccess.js";

const router = Router({ mergeParams: true });

router.use(requireAuth, loadAccessibleProject);

router.get("/", listProjectTasks);
router.post("/", createTask);
router.get("/:taskId", getTask);
router.patch("/:taskId", updateTask);
router.patch("/:taskId/status", updateTaskStatus);
router.post("/:taskId/checklist", addChecklistItem);
router.patch("/:taskId/checklist/:itemId", toggleChecklistItem);
router.delete("/:taskId", deleteTask);

export default router;
