import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { publicUser } from "../utils/sanitize.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userFilter = { isActive: true };

    // If not admin, restrict to project teammates (shared projects and owner)
    if (req.user.systemRole !== "admin" && req.user.role !== "admin") {
      const userProjects = await Project.find({
        $or: [
          { owner: req.user._id },
          { "members.user": req.user._id },
        ],
      }).select("members.user owner");

      const memberIdSet = new Set();
      memberIdSet.add(String(req.user._id));

      userProjects.forEach((p) => {
        if (p.owner) memberIdSet.add(String(p.owner));
        (p.members || []).forEach((m) => {
          if (m.user) memberIdSet.add(String(m.user));
        });
      });

      userFilter._id = { $in: Array.from(memberIdSet) };
    }

    const users = await User.find(userFilter).sort({ name: 1 });
    const userIds = users.map((u) => u._id);

    // Get active task counts for each user
    const taskCounts = await Task.aggregate([
      { $match: { assignee: { $in: userIds }, status: { $nin: ["completed", "done"] } } },
      { $group: { _id: "$assignee", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(taskCounts.map((tc) => [String(tc._id), tc.count]));

    const items = users.map((u) => ({
      ...publicUser(u),
      activeTasksCount: countMap[String(u._id)] || 0,
    }));

    res.json({
      success: true,
      data: { items },
    });
  })
);

export default router;
