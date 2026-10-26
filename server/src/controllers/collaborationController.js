import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";
import { Comment } from "../models/Comment.js";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicActivity } from "../utils/activity.js";
import { publicComment } from "../utils/commentView.js";
import { parsePagination } from "../utils/pagination.js";

async function loadProjectTask(projectId, taskId) {
  if (!mongoose.isValidObjectId(taskId)) throw new AppError("Task not found.", 404, "NOT_FOUND");
  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new AppError("Task not found.", 404, "NOT_FOUND");
  return task;
}

export const listTaskComments = asyncHandler(async (req, res) => {
  const task = await loadProjectTask(req.project._id, req.params.taskId);
  const { page, limit, skip } = parsePagination(req.query);
  const [comments, total] = await Promise.all([
    Comment.find({ task: task._id }).sort({ createdAt: 1 }).skip(skip).limit(limit).populate("author", "name"),
    Comment.countDocuments({ task: task._id }),
  ]);
  res.json({
    success: true,
    data: {
      items: comments.map(publicComment),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const createTaskComment = asyncHandler(async (req, res) => {
  const task = await loadProjectTask(req.project._id, req.params.taskId);
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!body || body.length > 2000) {
    throw new AppError("Comment must be between 1 and 2000 characters.", 400, "VALIDATION_ERROR");
  }

  const comment = await Comment.create({
    project: req.project._id,
    task: task._id,
    author: req.user._id,
    body,
    content: body,
  });
  await Activity.create({
    project: req.project._id,
    task: task._id,
    user: req.user._id,
    actor: req.user._id,
    action: "comment.created",
    summary: req.user.name + " commented on " + (task.title || "task"),
    description: req.user.name + " commented: " + body.slice(0, 80),
  });

  const populated = await Comment.findById(comment._id).populate("author", "name");
  res.status(201).json({ success: true, data: { comment: publicComment(populated) } });
});

export const listProjectActivity = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { project: req.project._id };
  if (req.query.taskId !== undefined) {
    if (!mongoose.isValidObjectId(req.query.taskId)) {
      throw new AppError("Task not found.", 404, "NOT_FOUND");
    }
    filter.task = req.query.taskId;
  }
  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("project", "name")
      .populate("task", "title")
      .populate("actor", "name email")
      .populate("user", "name email"),
    Activity.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: {
      items: activities.map(publicActivity),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const projectFilter = req.user.systemRole === "admin" ? {} : { "members.user": req.user._id };
  const projects = await Project.find(projectFilter)
    .select("name status dueDate")
    .sort({ updatedAt: -1 });
  const projectIds = projects.map((project) => project._id);
  const accessibleTaskFilter = { project: { $in: projectIds } };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [
    inProgress,
    completed,
    assigned,
    overdue,
    upcoming,
    statusCounts,
    priorityCounts,
    dueSoonTasks,
    projectTaskAgg,
  ] = await Promise.all([
    Task.countDocuments({ ...accessibleTaskFilter, status: "in_progress" }),
    Task.countDocuments({ ...accessibleTaskFilter, status: { $in: ["done", "completed"] } }),
    Task.countDocuments({ ...accessibleTaskFilter, assignee: req.user._id, status: { $nin: ["done", "completed"] } }),
    Task.countDocuments({ ...accessibleTaskFilter, dueDate: { $lt: today }, status: { $nin: ["done", "completed"] } }),
    Task.countDocuments({ ...accessibleTaskFilter, dueDate: { $gte: today, $lte: nextWeek }, status: { $nin: ["done", "completed"] } }),
    Task.aggregate([
      { $match: accessibleTaskFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: accessibleTaskFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
    Task.find({ ...accessibleTaskFilter, dueDate: { $ne: null }, status: { $nin: ["done", "completed"] } })
      .sort({ dueDate: 1 })
      .limit(8)
      .populate("project", "name")
      .populate("assignee", "name"),
    Task.aggregate([
      { $match: accessibleTaskFilter },
      {
        $group: {
          _id: "$project",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $in: ["$status", ["done", "completed"]] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const projectMap = Object.fromEntries(
    projectTaskAgg.map((pt) => [
      String(pt._id),
      { total: pt.total, completed: pt.completed },
    ])
  );

  const projectProgress = projects.slice(0, 6).map((p) => {
    const stats = projectMap[String(p._id)] || { total: 0, completed: 0 };
    const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    return {
      id: String(p._id),
      name: p.name,
      total: stats.total,
      completed: stats.completed,
      progress: pct,
    };
  });

  res.json({
    success: true,
    data: {
      metrics: {
        totalProjects: projects.length,
        totalTasks: await Task.countDocuments(accessibleTaskFilter),
        assignedToMe: assigned,
        inProgress,
        completed,
        overdue,
        upcoming,
      },
      taskStatus: statusCounts.map(({ _id, count }) => ({ status: _id || "todo", count })),
      taskPriority: priorityCounts.map(({ _id, count }) => ({ priority: _id || "medium", count })),
      projectProgress,
      dueSoon: dueSoonTasks.map((task) => ({
        id: String(task._id),
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        project: task.project ? { id: String(task.project._id), name: task.project.name } : null,
        assignee: task.assignee ? { id: String(task.assignee._id), name: task.assignee.name } : null,
      })),
    },
  });
});