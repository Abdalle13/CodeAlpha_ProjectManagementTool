import { Router } from "express";
import { changePassword, forgotPassword, login, logout, me, register, resetPassword, updateProfile } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/me", requireAuth, me);
router.put("/password", requireAuth, changePassword);
router.put("/profile", requireAuth, updateProfile);

export default router;
