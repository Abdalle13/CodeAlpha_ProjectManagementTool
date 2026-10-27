import { publicUser } from "./sanitize.js";

function mapUser(value) {
  if (!value) return null;
  if (value.name || value.email) return publicUser(value);
  return { id: String(value) };
}

export function publicTask(task) {
  const code = task.taskCode || ("TASK-" + String(task._id || task.id || "").slice(-4).toUpperCase());
  return {
    id: String(task._id || task.id),
    taskCode: code,
    project: task.project?._id
      ? { id: String(task.project._id), name: task.project.name, key: task.project.key || "PRJ", owner: mapUser(task.project.owner) }
      : { id: String(task.project) },
    title: task.title,
    description: task.description || "",
    status: task.status || "todo",
    priority: task.priority || "medium",
    assignee: mapUser(task.assignee),
    createdBy: mapUser(task.createdBy || task.reporter),
    reporter: mapUser(task.reporter || task.createdBy),
    dueDate: task.dueDate || null,
    estimatedHours: task.estimatedHours || 0,
    tags: Array.isArray(task.tags) ? task.tags : [],
    checklist: Array.isArray(task.checklist) ? task.checklist : [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
