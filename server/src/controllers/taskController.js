import mongoose from "mongoose";
import { Task, TASK_PRIORITIES, TASK_STATUSES } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { Comment } from "../models/Comment.js";
import { Project } from "../models/Project.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination } from "../utils/pagination.js";
import { publicTask } from "../utils/taskView.js";

function parseDueDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) {
    throw new AppError("Enter a valid due date.", 400, "VALIDATION_ERROR");
  }
  return dueDate;
}

function validateTaskInput(body, { partial = false } = {}) {
  const fields = {};

  if (!partial || body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (title.length < 2 || title.length > 160) {
      throw new AppError("Task title must be between 2 and 160 characters.", 400, "VALIDATION_ERROR");
    }
    fields.title = title;
  }

  if (!partial || body.description !== undefined) {
    const description = String(body.description || "").trim();
    if (description.length > 4000) {
      throw new AppError("Description must be 4000 characters or fewer.", 400, "VALIDATION_ERROR");
    }
    fields.description = description;
  }

  if (!partial || body.status !== undefined) {
    const status = body.status || "todo";
    if (!TASK_STATUSES.includes(status)) {
      throw new AppError("Choose a valid task status.", 400, "VALIDATION_ERROR");
    }
    fields.status = status;
  }

  if (!partial || body.priority !== undefined) {
    const priority = body.priority || "medium";
    if (!TASK_PRIORITIES.includes(priority)) {
      throw new AppError("Choose a valid task priority.", 400, "VALIDATION_ERROR");
    }
    fields.priority = priority;
  }

  if (!partial || body.dueDate !== undefined) fields.dueDate = parseDueDate(body.dueDate);
  return fields;
}

async function reloadTask(taskId) {
  return Task.findById(taskId)
    .populate("project", "name")
    .populate("assignee", "name email")
    .populate("createdBy", "name email");
}

function canManageTask(task, req) {
  return (
    ["owner", "admin"].includes(req.membership.role) ||
    task.createdBy.equals(req.user._id) ||
    task.assignee?.equals(req.user._id)
  );
}

export const listProjectTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { project: req.project._id };
  const status = String(req.query.status || "").trim();
  const priority = String(req.query.priority || "").trim();

  if (status) {
    if (!TASK_STATUSES.includes(status)) {
      throw new AppError("Choose a valid task status.", 400, "VALIDATION_ERROR");
    }
    filter.status = status;
  }
  if (priority) {
    if (!TASK_PRIORITIES.includes(priority)) {
      throw new AppError("Choose a valid task priority.", 400, "VALIDATION_ERROR");
    }
    filter.priority = priority;
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ dueDate: 1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("project", "name")
      .populate("assignee", "name email")
      .populate("createdBy", "name email"),
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

export const createProjectTask = asyncHandler(async (req, res) => {
  const fields = validateTaskInput(req.body);
  const assigneeId = req.body.assigneeId || null;
  if (assigneeId) {
    const isMember = req.project.members.some((member) => member.user._id.equals(assigneeId));
    if (!mongoose.isValidObjectId(assigneeId) || !isMember) {
      throw new AppError("Choose a member of this project as the assignee.", 400, "VALIDATION_ERROR");
    }
  }

  const task = await Task.create({
    ...fields,
    project: req.project._id,
    createdBy: req.user._id,
    assignee: assigneeId,
  });
  await Activity.create({
    project: req.project._id,
    task: task._id,
    actor: req.user._id,
    action: "task.created",
    summary: `Created task ${task.title}`,
  });
  const populated = await reloadTask(task._id);
  res.status(201).json({ success: true, data: { task: publicTask(populated) } });
});

export const updateProjectTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.taskId)) {
    throw new AppError("Task not found.", 404, "NOT_FOUND");
  }
  const task = await Task.findOne({ _id: req.params.taskId, project: req.project._id });
  if (!task) throw new AppError("Task not found.", 404, "NOT_FOUND");
  if (!canManageTask(task, req)) {
    throw new AppError("You do not have permission to update this task.", 403, "FORBIDDEN");
  }

  const fields = validateTaskInput(req.body, { partial: true });
  if (req.body.assigneeId !== undefined && !["owner", "admin"].includes(req.membership.role)) {
    throw new AppError("Only project owners and admins can change task assignments.", 403, "FORBIDDEN");
  }
  const previousStatus = task.status;
  const previousAssignee = task.assignee ? String(task.assignee) : null;
  if (req.body.assigneeId !== undefined) {
    const assigneeId = req.body.assigneeId || null;
    if (assigneeId) {
      const isMember =
        mongoose.isValidObjectId(assigneeId) &&
        req.project.members.some((member) => member.user._id.equals(assigneeId));
      if (!isMember) {
        throw new AppError("Choose a member of this project as the assignee.", 400, "VALIDATION_ERROR");
      }
    }
    fields.assignee = assigneeId;
  }

  Object.assign(task, fields);
  await task.save();
  if (fields.status !== undefined && fields.status !== previousStatus) {
    await Activity.create({
      project: req.project._id,
      task: task._id,
      actor: req.user._id,
      action: "task.status_changed",
      summary: `Moved ${task.title} to ${fields.status.replaceAll("_", " ")}`,
      metadata: { from: previousStatus, to: fields.status },
    });
  }
  if (fields.assignee !== undefined && String(fields.assignee || "") !== String(previousAssignee || "")) {
    await Activity.create({
      project: req.project._id,
      task: task._id,
      actor: req.user._id,
      action: "task.assigned",
      summary: fields.assignee ? `Assigned ${task.title}` : `Unassigned ${task.title}`,
      metadata: { assigneeId: fields.assignee ? String(fields.assignee) : null },
    });
  }
  const otherFields = Object.keys(fields).filter((field) => !["status", "assignee"].includes(field));
  if (otherFields.length) {
    await Activity.create({
      project: req.project._id,
      task: task._id,
      actor: req.user._id,
      action: "task.updated",
      summary: `Updated task ${task.title}`,
      metadata: { fields: otherFields },
    });
  }
  const populated = await reloadTask(task._id);
  res.json({ success: true, data: { task: publicTask(populated) } });
});

export const deleteProjectTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.taskId)) {
    throw new AppError("Task not found.", 404, "NOT_FOUND");
  }
  const task = await Task.findOne({ _id: req.params.taskId, project: req.project._id });
  if (!task) throw new AppError("Task not found.", 404, "NOT_FOUND");
  if (!["owner", "admin"].includes(req.membership.role) && !task.createdBy.equals(req.user._id)) {
    throw new AppError("You do not have permission to delete this task.", 403, "FORBIDDEN");
  }

  await Comment.deleteMany({ task: task._id });
  await task.deleteOne();
  await Activity.create({
    project: req.project._id,
    actor: req.user._id,
    action: "task.deleted",
    summary: `Deleted task ${task.title}`,
    metadata: { taskId: String(task._id), taskTitle: task.title },
  });
  res.json({ success: true, data: { task: null } });
});

export const listAccessibleTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const projectFilter = req.user.systemRole === "admin" ? {} : { "members.user": req.user._id };
  const projects = await Project.find(projectFilter).select("_id");
  const filter = { project: { $in: projects.map((project) => project._id) } };
  const status = String(req.query.status || "").trim();
  const priority = String(req.query.priority || "").trim();
  if (status) {
    if (!TASK_STATUSES.includes(status)) {
      throw new AppError("Choose a valid task status.", 400, "VALIDATION_ERROR");
    }
    filter.status = status;
  }
  if (priority) {
    if (!TASK_PRIORITIES.includes(priority)) {
      throw new AppError("Choose a valid task priority.", 400, "VALIDATION_ERROR");
    }
    filter.priority = priority;
  }
  if (req.query.assignedToMe !== undefined && !["true", "false"].includes(req.query.assignedToMe)) {
    throw new AppError("assignedToMe must be true or false.", 400, "VALIDATION_ERROR");
  }
  if (req.query.assignedToMe === "true") filter.assignee = req.user._id;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ dueDate: 1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("project", "name")
      .populate("assignee", "name email")
      .populate("createdBy", "name email"),
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