import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { UserDB, ProjectDB, TaskDB } from "../models/db.js";
import { publicUser } from "../utils/sanitize.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    let ids = null;

    if (req.user.systemRole !== "admin" && req.user.role !== "admin") {
      const projectIds = await ProjectDB.getUserProjectIds(req.user._id);
      const memberIdSet = new Set();
      memberIdSet.add(String(req.user._id));

      if (projectIds.length > 0) {
        for (const pid of projectIds) {
          const proj = await ProjectDB.findById(pid);
          if (proj) {
            const ownerId = proj.owner?._id || proj.owner?.id || proj.owner;
            if (ownerId) memberIdSet.add(String(ownerId));
            (proj.members || []).forEach((m) => {
              const uid = m.user?._id || m.user?.id || m.user;
              if (uid) memberIdSet.add(String(uid));
            });
          }
        }
      }
      ids = Array.from(memberIdSet);
    }

    const users = await UserDB.findAll({ isActive: true, ids: ids || undefined });
    const userIds = users.map((u) => u._id);
    const countMap = userIds.length > 0 ? await TaskDB.getAssigneeCounts(userIds) : {};

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
