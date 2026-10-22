import { Router } from "express";
import { getDashboard } from "../controllers/collaborationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.get("/", requireAuth, getDashboard);

export default router;