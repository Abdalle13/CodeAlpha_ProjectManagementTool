import { Router } from "express";
import {
  addMember,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  removeMember,
  updateMember,
  updateProject,
} from "../controllers/projectController.js";
import { requireAuth } from "../middleware/auth.js";
import { loadAccessibleProject, requireProjectRole } from "../middleware/projectAccess.js";

const router = Router();

router.use(requireAuth);

router.get("/", listProjects);
router.post("/", createProject);
router.get("/:id", loadAccessibleProject, getProject);
router.patch("/:id", loadAccessibleProject, requireProjectRole("owner", "admin"), updateProject);
router.delete("/:id", loadAccessibleProject, requireProjectRole("owner"), deleteProject);
router.post("/:id/members", loadAccessibleProject, requireProjectRole("owner", "admin"), addMember);
router.patch(
  "/:id/members/:userId",
  loadAccessibleProject,
  requireProjectRole("owner", "admin"),
  updateMember,
);
router.delete("/:id/members/:userId", loadAccessibleProject, removeMember);

export default router;
