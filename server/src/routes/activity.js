import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Activity } from "../models/Activity.js";
import { Project } from "../models/Project.js";
import { publicActivity } from "../utils/activity.js";
import { parsePagination } from "../utils/pagination.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const userRole = req.user.role || req.user.systemRole;

    const queryFilter = {};

    // For non-admins, scope to projects the user is a member/owner of
    if (userRole !== "admin") {
      const userProjects = await Project.find({
        $or: [
          { owner: req.user._id },
          { "members.user": req.user._id },
        ],
      }).select("_id");
      const projectIds = userProjects.map((p) => p._id);
      queryFilter.project = { $in: projectIds };
    }

    if (req.query.projectId) {
      queryFilter.project = req.query.projectId;
    }

    if (req.query.action && req.query.action !== "all") {
      // Allow prefix/partial matches (e.g., 'comment' matches 'comment.created' or 'commented')
      const actionQ = String(req.query.action).trim();
      queryFilter.action = { $regex: actionQ, $options: "i" };
    }

    if (req.query.memberId) {
      queryFilter.$or = [
        { actor: req.query.memberId },
        { user: req.query.memberId },
      ];
    }

    const [activities, total] = await Promise.all([
      Activity.find(queryFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("project", "name key")
        .populate("task", "title taskCode")
        .populate("actor", "name email avatarColor")
        .populate("user", "name email avatarColor"),
      Activity.countDocuments(queryFilter),
    ]);

    res.json({
      success: true,
      data: {
        items: activities.map(publicActivity),
        pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  })
);

export default router;
