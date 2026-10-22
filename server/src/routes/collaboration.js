import { Router } from "express";
import {
  createTaskComment,
  listProjectActivity,
  listTaskComments,
} from "../controllers/collaborationController.js";
import { requireAuth } from "../middleware/auth.js";
import { loadAccessibleProject } from "../middleware/projectAccess.js";

const router = Router({ mergeParams: true });
router.use(requireAuth, loadAccessibleProject);
router.get("/activity", listProjectActivity);
router.get("/tasks/:taskId/comments", listTaskComments);
router.post("/tasks/:taskId/comments", createTaskComment);

export default router;