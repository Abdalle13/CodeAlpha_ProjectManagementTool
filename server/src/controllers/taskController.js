import mongoose from "mongoose";
import { Task, TASK_PRIORITIES, TASK_STATUSES } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { Comment } from "../models/Comment.js";
import { Project } from "../models/Project.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination, escapeRegex } from "../utils/pagination.js";
import { publicTask } from "../utils/taskView.js";

function parseDueDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) {
    throw new AppError("Enter a valid due date.", 400, "VALIDATION_ERROR");
  }
  return dueDate;
}

async function reloadTask(taskId) {
  return Task.findById(taskId)
    .populate("project", "name key")
    .populate("assignee", "name email role avatarColor")
    .populate("reporter", "name email role avatarColor")
    .populate("createdBy", "name email role avatarColor");
}

function canManageTask(task, req) {
  const isGlobalAdmin = req.user.systemRole === "admin" || req.user.role === "admin";
  const isProjectLead = ["owner", "admin", "lead"].includes(req.membership?.role);
  const isCreator = task.createdBy?.equals(req.user._id);
  const isAssignee = task.assignee?.equals(req.user._id);
  return isGlobalAdmin || isProjectLead || isCreator || isAssignee;
}

export const listProjectTasks = asyncHandler(async (req, res) => {
  const filter = { project: req.project._id };

  if (req.query.status && TASK_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.priority && TASK_PRIORITIES.includes(req.query.priority)) {
    filter.priority = req.query.priority;
  }
  if (req.query.assigneeId && mongoose.isValidObjectId(req.query.assigneeId)) {
    filter.assignee = req.query.assigneeId;
  }
  if (req.query.q) {
    const escaped = escapeRegex(req.query.q.trim());
    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { taskCode: { $regex: escaped, $options: "i" } },
      { tags: { $regex: escaped, $options: "i" } },
    ];
  }

  const tasks = await Task.find(filter)
    .sort({ createdAt: -1 })
    .populate("project", "name key")
    .populate("assignee", "name email role avatarColor")
    .populate("reporter", "name email role avatarColor")
    .populate("createdBy", "name email role avatarColor");

  res.json({
    success: true,
    data: {
      items: tasks.map(publicTask),
      total: tasks.length,
    },
  });
});

export const listAllAccessibleTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const userRole = req.user.role || req.user.systemRole;

  let projectFilter = {};
  if (userRole !== "admin") {
    const userProjects = await Project.find({ "members.user": req.user._id }).select("_id");
    projectFilter = { project: { $in: userProjects.map((p) => p._id) } };
  }

  const filter = { ...projectFilter };

  if (req.query.assignedToMe !== undefined) {
    if (req.query.assignedToMe !== "true" && req.query.assignedToMe !== "false") {
      throw new AppError("assignedToMe must be true or false.", 400, "VALIDATION_ERROR");
    }
    if (req.query.assignedToMe === "true") {
      filter.assignee = req.user._id;
    }
  }
  if (req.query.myTasks === "true") {
    filter.assignee = req.user._id;
  }
  const status = String(req.query.status || "").trim();
  if (status) {
    if (!TASK_STATUSES.includes(status)) {
      throw new AppError("Choose a valid task status.", 400, "VALIDATION_ERROR");
    }
    filter.status = status;
  }
  const priority = String(req.query.priority || "").trim();
  if (priority) {
    if (!TASK_PRIORITIES.includes(priority)) {
      throw new AppError("Choose a valid task priority.", 400, "VALIDATION_ERROR");
    }
    filter.priority = priority;
  }
  if (req.query.projectId && mongoose.isValidObjectId(req.query.projectId)) {
    filter.project = req.query.projectId;
  }
  if (req.query.q) {
    const escaped = escapeRegex(req.query.q.trim());
    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { taskCode: { $regex: escaped, $options: "i" } },
    ];
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("project", "name key")
      .populate("assignee", "name email role avatarColor")
      .populate("reporter", "name email role avatarColor")
      .populate("createdBy", "name email role avatarColor"),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: tasks.map(publicTask),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

export const createTask = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();
  if (title.length < 2 || title.length > 200) {
    throw new AppError("Task title must be between 2 and 200 characters.", 400, "VALIDATION_ERROR");
  }

  const status = req.body.status && TASK_STATUSES.includes(req.body.status) ? req.body.status : "todo";
  if (req.body.status && !TASK_STATUSES.includes(req.body.status)) {
    throw new AppError("Choose a valid task status.", 400, "VALIDATION_ERROR");
  }

  const priority = req.body.priority && TASK_PRIORITIES.includes(req.body.priority) ? req.body.priority : "medium";
  if (req.body.priority && !TASK_PRIORITIES.includes(req.body.priority)) {
    throw new AppError("Choose a valid task priority.", 400, "VALIDATION_ERROR");
  }

  const project = req.project;
  const projectKey = project.key || "PRJ";

  let assignee = null;
  if (req.body.assigneeId) {
    if (!mongoose.isValidObjectId(req.body.assigneeId)) {
      throw new AppError("Choose a member of this project as the assignee.", 400, "VALIDATION_ERROR");
    }
    const isMember = project.members.some((m) => m.user?._id?.equals(req.body.assigneeId) || m.user?.equals?.(req.body.assigneeId));
    if (!isMember) {
      throw new AppError("Choose a member of this project as the assignee.", 400, "VALIDATION_ERROR");
    }
    assignee = req.body.assigneeId;
  }

  project.taskSequence = (project.taskSequence || 100) + 1;
  await project.save();
  const taskCode = projectKey + "-" + project.taskSequence;

  const dueDate = parseDueDate(req.body.dueDate);
  const estimatedHours = Number(req.body.estimatedHours) || 0;
  const tags = Array.isArray(req.body.tags) ? req.body.tags.map((t) => String(t).trim()).filter(Boolean) : [];

  const task = await Task.create({
    project: project._id,
    taskCode,
    title,
    description: String(req.body.description || "").trim(),
    status,
    priority,
    assignee,
    reporter: req.user._id,
    createdBy: req.user._id,
    dueDate,
    estimatedHours,
    tags,
    checklist: [],
  });

  await Activity.create({
    project: project._id,
    task: task._id,
    user: req.user._id,
    actor: req.user._id,
    action: "task.created",
    summary: "Created task " + task.title,
    description: req.user.name + " created task " + task.taskCode + ": " + task.title,
  });

  const hydrated = await reloadTask(task._id);
  res.status(201).json({
    success: true,
    data: { task: publicTask(hydrated) },
  });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await reloadTask(req.params.taskId);
  if (!task) {
    throw new AppError("Task not found.", 404, "NOT_FOUND");
  }
  res.json({
    success: true,
    data: { task: publicTask(task) },
  });
});

export const updateTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.taskId)) {
    throw new AppError("Task not found.", 404, "NOT_FOUND");
  }

  const task = await Task.findOne({ _id: req.params.taskId, project: req.project._id });
  if (!task) {
    throw new AppError("Task not found.", 404, "NOT_FOUND");
  }

  if (!canManageTask(task, req)) {
    throw new AppError("You do not have permission to update this task.", 403, "FORBIDDEN");
  }

  const isOwnerOrAdmin =
    ["owner", "admin", "lead"].includes(req.membership?.role) ||
    req.user.systemRole === "admin" ||
    req.user.role === "admin";

  if (req.body.assigneeId !== undefined && !isOwnerOrAdmin) {
    const currentAssigneeStr = task.assignee ? String(task.assignee) : "";
    const requestedAssigneeStr = req.body.assigneeId ? String(req.body.assigneeId).trim() : "";
    if (currentAssigneeStr !== requestedAssigneeStr) {
      throw new AppError("Only project owners and admins can change task assignments.", 403, "FORBIDDEN");
    }
  }

  if (req.body.title !== undefined) {
    const title = String(req.body.title).trim();
    if (title.length < 2 || title.length > 200) {
      throw new AppError("Task title must be between 2 and 200 characters.", 400, "VALIDATION_ERROR");
    }
    task.title = title;
  }
  if (req.body.description !== undefined) {
    task.description = String(req.body.description).trim();
  }
  if (req.body.status) {
    if (!TASK_STATUSES.includes(req.body.status)) {
      throw new AppError("Choose a valid task status.", 400, "VALIDATION_ERROR");
    }
    task.status = req.body.status;
  }
  if (req.body.priority) {
    if (!TASK_PRIORITIES.includes(req.body.priority)) {
      throw new AppError("Choose a valid task priority.", 400, "VALIDATION_ERROR");
    }
    task.priority = req.body.priority;
  }
  if (req.body.assigneeId !== undefined) {
    if (req.body.assigneeId === null || req.body.assigneeId === "") {
      task.assignee = null;
    } else {
      if (!mongoose.isValidObjectId(req.body.assigneeId)) {
        throw new AppError("Choose a member of this project as the assignee.", 400, "VALIDATION_ERROR");
      }
      const isMember = req.project.members.some(
        (m) => m.user?._id?.equals(req.body.assigneeId) || m.user?.equals?.(req.body.assigneeId)
      );
      if (!isMember) {
        throw new AppError("Choose a member of this project as the assignee.", 400, "VALIDATION_ERROR");
      }
      task.assignee = req.body.assigneeId;
    }
  }
  if (req.body.dueDate !== undefined) {
    task.dueDate = parseDueDate(req.body.dueDate);
  }
  if (req.body.estimatedHours !== undefined) {
    task.estimatedHours = Number(req.body.estimatedHours) || 0;
  }
  if (Array.isArray(req.body.tags)) {
    task.tags = req.body.tags.map((t) => String(t).trim()).filter(Boolean);
  }

  await task.save();

  await Activity.create({
    project: task.project,
    task: task._id,
    user: req.user._id,
    actor: req.user._id,
    action: "task.updated",
    summary: "Updated task " + task.title,
    description: req.user.name + " updated task " + (task.taskCode || task.title),
  });

  const hydrated = await reloadTask(task._id);
  res.json({
    success: true,
    data: { task: publicTask(hydrated) },
  });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!TASK_STATUSES.includes(status)) {
    throw new AppError("Invalid task status.", 400, "VALIDATION_ERROR");
  }

  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new AppError("Task not found.", 404, "NOT_FOUND");
  }

  const oldStatus = task.status;
  task.status = status;
  await task.save();

  await Activity.create({
    project: task.project,
    task: task._id,
    user: req.user._id,
    actor: req.user._id,
    action: "task.status_changed",
    summary: "Moved " + task.title + " to " + status.replace("_", " "),
    description: req.user.name + " moved " + (task.taskCode || task.title) + " from " + oldStatus + " to " + status,
    metadata: { from: oldStatus, to: status },
  });

  const hydrated = await reloadTask(task._id);
  res.json({
    success: true,
    data: { task: publicTask(hydrated) },
  });
});

export const addChecklistItem = asyncHandler(async (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) {
    throw new AppError("Checklist item text is required.", 400, "VALIDATION_ERROR");
  }

  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new AppError("Task not found.", 404, "NOT_FOUND");
  }

  task.checklist.push({ text, completed: false });
  await task.save();

  const hydrated = await reloadTask(task._id);
  res.status(201).json({
    success: true,
    data: { task: publicTask(hydrated) },
  });
});

export const toggleChecklistItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new AppError("Task not found.", 404, "NOT_FOUND");
  }

  const item = task.checklist.id(itemId);
  if (!item) {
    throw new AppError("Checklist item not found.", 404, "NOT_FOUND");
  }

  item.completed = !item.completed;
  await task.save();

  const hydrated = await reloadTask(task._id);
  res.json({
    success: true,
    data: { task: publicTask(hydrated) },
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.taskId)) {
    throw new AppError("Task not found.", 404, "NOT_FOUND");
  }

  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new AppError("Task not found.", 404, "NOT_FOUND");
  }

  const isOwnerOrAdmin =
    ["owner", "admin", "lead"].includes(req.membership?.role) ||
    req.user.systemRole === "admin" ||
    req.user.role === "admin";

  if (!isOwnerOrAdmin && !task.createdBy?.equals(req.user._id)) {
    throw new AppError("You do not have permission to delete this task.", 403, "FORBIDDEN");
  }

  await Promise.all([
    Comment.deleteMany({ task: task._id }),
    Activity.deleteMany({ task: task._id }),
    task.deleteOne(),
  ]);

  await Activity.create({
    project: task.project,
    user: req.user._id,
    actor: req.user._id,
    action: "task.deleted",
    summary: "Deleted task " + task.title,
  });

  res.json({
    success: true,
    data: { task: null, message: "Task removed." },
  });
});
