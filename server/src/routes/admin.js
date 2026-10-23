import { Router } from "express";
import {
  listUsers,
  updateUserRole,
  toggleUserStatus,
  listAllProjects,
  getSystemStats,
} from "../controllers/adminController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSystemAdmin } from "../middleware/systemAdmin.js";

const router = Router();

router.use(requireAuth, requireSystemAdmin);

router.get("/stats", getSystemStats);
router.get("/users", listUsers);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/status", toggleUserStatus);
router.get("/projects", listAllProjects);

export default router;
