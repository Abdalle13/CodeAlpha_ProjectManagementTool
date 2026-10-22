import { Router } from "express";
import { bootstrapSystemAdmin, deleteAnyProject, listAllProjects, listUsers, updateUser } from "../controllers/adminController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSystemAdmin } from "../middleware/systemAdmin.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/bootstrap", authLimiter, requireAuth, bootstrapSystemAdmin);
router.use(requireAuth, requireSystemAdmin);
router.get("/users", listUsers);
router.patch("/users/:userId", updateUser);
router.get("/projects", listAllProjects);
router.delete("/projects/:projectId", deleteAnyProject);

export default router;