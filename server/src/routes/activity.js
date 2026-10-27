import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { ActivityDB, ProjectDB } from "../models/db.js";
import { publicActivity } from "../utils/activity.js";
import { parsePagination } from "../utils/pagination.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const userRole = req.user.role || req.user.systemRole;

    let projectIds = null;
    if (userRole !== "admin") {
      projectIds = await ProjectDB.getUserProjectIds(req.user._id);
    }
    if (req.query.projectId) {
      projectIds = [req.query.projectId];
    }

    const { items, total } = await ActivityDB.findFeed({
      userId: req.query.memberId,
      projectIds: projectIds || undefined,
      action: req.query.action && req.query.action !== "all" ? req.query.action : undefined,
      page,
      limit,
    });

    res.json({
      success: true,
      data: {
        items: items.map(publicActivity),
        pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  })
);

export default router;
