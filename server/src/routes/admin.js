import { Router } from "express";
import {
  bootstrapSystemAdmin,
  listUsers,
  createAdminUser,
  updateUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  listAllProjects,
  deleteAnyProject,
  getSystemStats,
  listSystemActivities,
} from "../controllers/adminController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSystemAdmin } from "../middleware/systemAdmin.js";

const router = Router();

// Bootstrap endpoint: uses requireAuth ONLY
router.post("/bootstrap", requireAuth, bootstrapSystemAdmin);

// All protected system admin endpoints:
router.use(requireAuth, requireSystemAdmin);

router.get("/stats", getSystemStats);
router.get("/activity", listSystemActivities);
router.get("/users", listUsers);
router.post("/users", createAdminUser);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/status", toggleUserStatus);
router.patch("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);
router.get("/projects", listAllProjects);
router.delete("/projects/:projectId", deleteAnyProject);

export default router;
