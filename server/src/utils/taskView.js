import { publicUser } from "./sanitize.js";

function mapUser(value) {
  if (!value) return null;
  if (value.name || value.email) return publicUser(value);
  return { id: String(value) };
}

export function publicTask(task) {
  return {
    id: String(task._id || task.id),
    project: task.project?._id
      ? { id: String(task.project._id), name: task.project.name }
      : { id: String(task.project) },
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: mapUser(task.assignee),
    createdBy: mapUser(task.createdBy),
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}