import { ActivityDB, CommentDB, TaskDB, ProjectDB } from "../models/db.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicActivity } from "../utils/activity.js";
import { publicComment } from "../utils/commentView.js";
import { parsePagination } from "../utils/pagination.js";

export const listTaskComments = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { items, total } = await CommentDB.findByTask(req.params.taskId, { page, limit });
  res.json({
    success: true,
    data: {
      items: items.map(publicComment),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const createTaskComment = asyncHandler(async (req, res) => {
  let body = "";
  if (typeof req.body === "string") body = req.body.trim();
  else if (req.body?.body) body = String(req.body.body).trim();
  else if (req.body?.content) body = String(req.body.content).trim();

  if (!body) throw new AppError("Comment cannot be empty.", 400, "VALIDATION_ERROR");
  if (body.length > 2000) throw new AppError("Comment must be under 2000 characters.", 400, "VALIDATION_ERROR");

  const comment = await CommentDB.create({
    project: req.project._id,
    task: req.params.taskId,
    author: req.user._id,
    body,
  });

  await ActivityDB.create({
    project: req.project._id,
    task: req.params.taskId,
    user: req.user._id,
    actor: req.user._id,
    action: "comment.created",
    summary: req.user.name + " commented",
    description: req.user.name + " commented: " + body.slice(0, 80),
  });

  res.status(201).json({ success: true, data: { comment: publicComment(comment) } });
});

export const deleteTaskComment = asyncHandler(async (req, res) => {
  const comment = await CommentDB.findOne({
    id: req.params.commentId,
    task_id: req.params.taskId,
    project_id: req.project._id,
  });
  if (!comment) throw new AppError("Comment not found.", 404, "NOT_FOUND");

  const authorId = String(comment.author?._id || comment.author || "");
  const isAuthor = authorId === String(req.user._id);
  const isGlobalAdmin = req.user.systemRole === "admin" || req.user.role === "admin";

  if (!isAuthor && !isGlobalAdmin) throw new AppError("Only the author of this comment can delete it.", 403, "FORBIDDEN");

  await CommentDB.delete(comment._id);
  res.json({ success: true, data: { message: "Comment deleted successfully." } });
});

export const listProjectActivity = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { items, total } = await ActivityDB.findByProject(req.project._id, {
    taskId: req.query.taskId || undefined,
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
});

export const getDashboard = asyncHandler(async (req, res) => {
  const isAdmin = req.user.systemRole === "admin" || req.user.role === "admin";
  let projectIds;

  if (isAdmin) {
    const { items } = await ProjectDB.findAll({ isAdmin: true, page: 1, limit: 1000 });
    projectIds = items.map(p => String(p._id));
  } else {
    projectIds = await ProjectDB.getUserProjectIds(req.user._id);
  }

  if (projectIds.length === 0) {
    return res.json({
      success: true,
      data: {
        metrics: { totalProjects: 0, totalTasks: 0, assignedToMe: 0, inProgress: 0, completed: 0, overdue: 0, upcoming: 0 },
        taskStatus: [], taskPriority: [], projectProgress: [], dueSoon: [],
      },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [totalTasks, inProgress, completed, assignedToMe, overdue, upcoming, taskStatus, taskPriority, projectTaskAgg, dueSoonTasks] = await Promise.all([
    TaskDB.countDocuments({ project_ids: projectIds }),
    TaskDB.countDocuments({ project_ids: projectIds, status: "in_progress" }),
    TaskDB.countDocuments({ project_ids: projectIds, statuses: ["done", "completed"] }),
    TaskDB.countDocuments({ project_ids: projectIds, assignee_id: req.user._id, excludeStatuses: ["done", "completed"] }),
    TaskDB.countDocuments({ project_ids: projectIds, dueBefore: today, excludeStatuses: ["done", "completed"] }),
    TaskDB.countDocuments({ project_ids: projectIds, dueBetween: { from: today, to: nextWeek }, excludeStatuses: ["done", "completed"] }),
    TaskDB.getGroupedStatusCounts(projectIds),
    TaskDB.getGroupedPriorityCounts(projectIds),
    TaskDB.getProjectTaskAgg(projectIds),
    TaskDB.getDueSoon(projectIds, 8),
  ]);

  const { items: projects } = isAdmin
    ? await ProjectDB.findAll({ isAdmin: true, page: 1, limit: 6 })
    : await ProjectDB.findAll({ userId: req.user._id, page: 1, limit: 6 });

  const projectProgress = projects.slice(0, 6).map(p => {
    const stats = projectTaskAgg[String(p._id)] || { total: 0, completed: 0 };
    return {
      id: String(p._id),
      name: p.name,
      total: stats.total,
      completed: stats.completed,
      progress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    };
  });

  res.json({
    success: true,
    data: {
      metrics: { totalProjects: projectIds.length, totalTasks, assignedToMe, inProgress, completed, overdue, upcoming },
      taskStatus,
      taskPriority,
      projectProgress,
      dueSoon: dueSoonTasks.map(task => ({
        id: String(task._id),
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        project: task.project ? { id: String(task.project._id || task.project), name: task.project.name } : null,
        assignee: task.assignee ? { id: String(task.assignee._id || task.assignee), name: task.assignee.name } : null,
      })),
    },
  });
});