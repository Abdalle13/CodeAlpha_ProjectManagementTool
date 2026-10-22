import { Activity } from "../models/Activity.js";

export function recordActivity({ project, task = null, actor, action, summary, metadata = {} }) {
  return Activity.create({ project, task, actor, action, summary, metadata });
}

export function publicActivity(activity) {
  return {
    id: String(activity._id || activity.id),
    project: activity.project?._id
      ? { id: String(activity.project._id), name: activity.project.name }
      : { id: String(activity.project) },
    task: activity.task
      ? activity.task?._id
        ? { id: String(activity.task._id), title: activity.task.title }
        : { id: String(activity.task) }
      : null,
    actor: activity.actor?.name
      ? { id: String(activity.actor._id), name: activity.actor.name }
      : { id: String(activity.actor) },
    action: activity.action,
    summary: activity.summary,
    metadata: activity.metadata || {},
    createdAt: activity.createdAt,
  };
}