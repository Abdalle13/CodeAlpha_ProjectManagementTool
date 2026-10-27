import { TaskDB, ActivityDB, CommentDB, ProjectDB } from "../models/db.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination } from "../utils/pagination.js";
import { publicTask } from "../utils/taskView.js";

export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done", "completed"];
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];

function parseDueDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new AppError("Enter a valid due date.", 400, "VALIDATION_ERROR");
  return d;
}

function canManageTask(task, req) {
  const isGlobalAdmin = req.user.systemRole === "admin" || req.user.role === "admin";
  const projectOwnerId = String(req.project?.owner_id || req.project?.owner?._id || req.project?.owner || "");
  const isProjectOwner = projectOwnerId === String(req.user._id);
  const createdBy = String(task.createdBy?._id || task.createdBy || "");
  const reporter = String(task.reporter?._id || task.reporter || "");
  const isCreator = createdBy === String(req.user._id) || reporter === String(req.user._id);
  return Boolean(isGlobalAdmin || isProjectOwner || isCreator);
}

function canChangeTaskStatus(task, req) {
  if (canManageTask(task, req)) return true;
  const assigneeId = String(task.assignee?._id || task.assignee || "");
  return assigneeId === String(req.user._id);
}

export const listProjectTasks = asyncHandler(async (req, res) => {
  const tasks = await TaskDB.findByProject(req.project._id, {
    status: (req.query.status && TASK_STATUSES.includes(req.query.status)) ? req.query.status : undefined,
    priority: (req.query.priority && TASK_PRIORITIES.includes(req.query.priority)) ? req.query.priority : undefined,
    assigneeId: req.query.assigneeId || undefined,
    search: req.query.q || undefined,
  });

  res.json({ success: true, data: { items: tasks.map(publicTask), total: tasks.length } });
});

export const listAllAccessibleTasks = asyncHandler(async (req, res) => {
  if (req.query.limit !== undefined && (Number(req.query.limit) > 50 || Number(req.query.limit) < 1)) {
    throw new AppError("Limit must be an integer between 1 and 50.", 400, "VALIDATION_ERROR");
  }
  const { page, limit } = parsePagination(req.query, 50);
  const userRole = req.user.role || req.user.systemRole;

  let projectIds;
  if (userRole !== "admin") {
    projectIds = await ProjectDB.getUserProjectIds(req.user._id);
    if (projectIds.length === 0) {
      return res.json({ success: true, data: { items: [], pagination: { page, limit, total: 0, pages: 1 } } });
    }
  }

  const status = String(req.query.status || "").trim();
  const priority = String(req.query.priority || "").trim();

  const { items, total } = await TaskDB.findPaginated({
    projectIds,
    assigneeId: (req.query.assignedToMe === "true" || req.query.myTasks === "true") ? req.user._id : undefined,
    status: (status && TASK_STATUSES.includes(status)) ? status : undefined,
    priority: (priority && TASK_PRIORITIES.includes(priority)) ? priority : undefined,
    projectId: req.query.projectId || undefined,
    search: req.query.q || undefined,
    page,
    limit,
  });

  res.json({
    success: true,
    data: { items: items.map(publicTask), pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } },
  });
});

export const createTask = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();
  if (title.length < 2 || title.length > 200) throw new AppError("Task title must be between 2 and 200 characters.", 400, "VALIDATION_ERROR");

  const status = req.body.status && TASK_STATUSES.includes(req.body.status) ? req.body.status : "todo";
  const priority = req.body.priority && TASK_PRIORITIES.includes(req.body.priority) ? req.body.priority : "medium";

  const project = req.project;
  const projectKey = project.key || "PRJ";

  let assignee = null;
  if (req.body.assigneeId) {
    const ownerId = String(project.owner?._id || project.owner_id || project.owner || "");
    const isMember = ownerId === req.body.assigneeId ||
      (project.members || []).some(m => String(m.user?._id || m.user) === req.body.assigneeId);
    if (!isMember) throw new AppError("Choose a member of this project as the assignee.", 400, "VALIDATION_ERROR");
    assignee = req.body.assigneeId;
  }

  const newSeq = (project.taskSequence || 100) + 1;
  await ProjectDB.update(project._id, { taskSequence: newSeq });
  const taskCode = projectKey + "-" + newSeq;

  const task = await TaskDB.create({
    project: project._id,
    project_id: project._id,
    taskCode,
    title,
    description: String(req.body.description || "").trim(),
    status,
    priority,
    assignee,
    reporter: req.user._id,
    createdBy: req.user._id,
    dueDate: parseDueDate(req.body.dueDate),
    estimatedHours: Number(req.body.estimatedHours) || 0,
    tags: Array.isArray(req.body.tags) ? req.body.tags.map(t => String(t).trim()).filter(Boolean) : [],
    checklist: [],
  });

  await ActivityDB.create({
    project: project._id,
    task: task._id,
    user: req.user._id,
    actor: req.user._id,
    action: "task.created",
    summary: "Created task " + task.title,
    description: req.user.name + " created task " + task.taskCode + ": " + task.title,
  });

  res.status(201).json({ success: true, data: { task: publicTask(task) } });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await TaskDB.findById(req.params.taskId);
  if (!task) throw new AppError("Task not found.", 404, "NOT_FOUND");
  res.json({ success: true, data: { task: publicTask(task) } });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await TaskDB.findOne({ id: req.params.taskId, project_id: req.project._id });
  if (!task) throw new AppError("Task not found.", 404, "NOT_FOUND");
  if (!canManageTask(task, req)) throw new AppError("You do not have permission to update this task.", 403, "FORBIDDEN");

  const isOwnerOrAdmin = ["owner", "admin", "lead"].includes(req.membership?.role) || req.user.systemRole === "admin" || req.user.role === "admin";

  const updates = {};
  if (req.body.title !== undefined) {
    const t = String(req.body.title).trim();
    if (t.length < 2 || t.length > 200) throw new AppError("Task title must be between 2 and 200 characters.", 400, "VALIDATION_ERROR");
    updates.title = t;
  }
  if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
  if (req.body.status) {
    if (!TASK_STATUSES.includes(req.body.status)) throw new AppError("Choose a valid task status.", 400, "VALIDATION_ERROR");
    updates.status = req.body.status;
  }
  if (req.body.priority) {
    if (!TASK_PRIORITIES.includes(req.body.priority)) throw new AppError("Choose a valid task priority.", 400, "VALIDATION_ERROR");
    updates.priority = req.body.priority;
  }
  if (req.body.assigneeId !== undefined) {
    if (!isOwnerOrAdmin) {
      const currentAssignee = String(task.assignee?._id || task.assignee || "");
      if (currentAssignee !== String(req.body.assigneeId || "")) {
        throw new AppError("Only project owners and admins can change task assignments.", 403, "FORBIDDEN");
      }
    }
    if (req.body.assigneeId === null || req.body.assigneeId === "") {
      updates.assignee = null;
    } else {
      const ownerId = String(req.project.owner?._id || req.project.owner_id || req.project.owner || "");
      const isMember = ownerId === req.body.assigneeId ||
        (req.project.members || []).some(m => String(m.user?._id || m.user) === req.body.assigneeId);
      if (!isMember) throw new AppError("Choose a member of this project as the assignee.", 400, "VALIDATION_ERROR");
      updates.assignee = req.body.assigneeId;
    }
  }
  if (req.body.dueDate !== undefined) updates.dueDate = parseDueDate(req.body.dueDate);
  if (req.body.estimatedHours !== undefined) updates.estimatedHours = Number(req.body.estimatedHours) || 0;
  if (Array.isArray(req.body.tags)) updates.tags = req.body.tags.map(t => String(t).trim()).filter(Boolean);

  const updated = await TaskDB.update(task._id, updates);

  await ActivityDB.create({
    project: task.project_id || task.project?._id,
    task: task._id,
    user: req.user._id,
    actor: req.user._id,
    action: "task.updated",
    summary: "Updated task " + task.title,
    description: req.user.name + " updated task " + (task.taskCode || task.title),
  });

  res.json({ success: true, data: { task: publicTask(updated) } });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!TASK_STATUSES.includes(status)) throw new AppError("Invalid task status.", 400, "VALIDATION_ERROR");

  const task = await TaskDB.findById(req.params.taskId);
  if (!task) throw new AppError("Task not found.", 404, "NOT_FOUND");
  if (!canChangeTaskStatus(task, req)) throw new AppError("You do not have permission to change the status of this task.", 403, "FORBIDDEN");

  const oldStatus = task.status;
  const updated = await TaskDB.update(task._id, { status });

  await ActivityDB.create({
    project: task.project_id || task.project?._id,
    task: task._id,
    user: req.user._id,
    actor: req.user._id,
    action: "task.status_changed",
    summary: "Moved " + task.title + " to " + status.replace("_", " "),
    description: req.user.name + " moved " + (task.taskCode || task.title) + " from " + oldStatus + " to " + status,
    metadata: { from: oldStatus, to: status },
  });

  res.json({ success: true, data: { task: publicTask(updated) } });
});

export const addChecklistItem = asyncHandler(async (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) throw new AppError("Checklist item text is required.", 400, "VALIDATION_ERROR");

  const task = await TaskDB.findById(req.params.taskId);
  if (!task) throw new AppError("Task not found.", 404, "NOT_FOUND");

  const newChecklist = [...(task.checklist || []), { id: Date.now().toString(), text, completed: false }];
  const updated = await TaskDB.update(task._id, { checklist: newChecklist });

  res.status(201).json({ success: true, data: { task: publicTask(updated) } });
});

export const toggleChecklistItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const task = await TaskDB.findById(req.params.taskId);
  if (!task) throw new AppError("Task not found.", 404, "NOT_FOUND");

  const checklist = (task.checklist || []).map(item => {
    const id = String(item._id || item.id || "");
    return id === String(itemId) ? { ...item, completed: !item.completed } : item;
  });
  const updated = await TaskDB.update(task._id, { checklist });

  res.json({ success: true, data: { task: publicTask(updated) } });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await TaskDB.findById(req.params.taskId);
  if (!task) throw new AppError("Task not found.", 404, "NOT_FOUND");
  if (!canManageTask(task, req)) throw new AppError("You do not have permission to delete this task.", 403, "FORBIDDEN");

  await CommentDB.deleteMany({ task_id: task._id });
  await ActivityDB.deleteMany({ task_id: task._id });
  await TaskDB.delete(task._id);

  await ActivityDB.create({
    project: task.project_id || task.project?._id,
    user: req.user._id,
    actor: req.user._id,
    action: "task.deleted",
    summary: "Deleted task " + task.title,
  });

  res.json({ success: true, data: { task: null, message: "Task removed." } });
});
