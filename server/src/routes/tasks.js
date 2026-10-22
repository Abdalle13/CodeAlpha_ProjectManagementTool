import { Router } from "express";
import {
  createProjectTask,
  deleteProjectTask,
  listProjectTasks,
  updateProjectTask,
} from "../controllers/taskController.js";
import { requireAuth } from "../middleware/auth.js";
import { loadAccessibleProject } from "../middleware/projectAccess.js";

const router = Router({ mergeParams: true });

router.use(requireAuth, loadAccessibleProject);
router.get("/", listProjectTasks);
router.post("/", createProjectTask);
router.patch("/:taskId", updateProjectTask);
router.delete("/:taskId", deleteProjectTask);

export default router;