import { ActivityDB } from "../models/db.js";

export function recordActivity({ project, task = null, actor, action, summary, metadata = {} }) {
  return ActivityDB.create({ project, task, actor, action, summary, metadata });
}

export function publicActivity(activity) {
  const actorObj = activity.actor || activity.user;
  return {
    id: String(activity._id || activity.id),
    project: activity.project?._id
      ? { id: String(activity.project._id), name: activity.project.name, key: activity.project.key }
      : activity.project
      ? { id: String(activity.project) }
      : null,
    task: activity.task
      ? activity.task?._id
        ? { id: String(activity.task._id), title: activity.task.title, taskCode: activity.task.taskCode }
        : { id: String(activity.task) }
      : null,
    actor: actorObj?.name
      ? { id: String(actorObj._id || actorObj.id), name: actorObj.name, email: actorObj.email, avatarColor: actorObj.avatarColor }
      : actorObj
      ? { id: String(actorObj), name: "Team Member" }
      : { name: "System" },
    action: activity.action || "updated",
    summary: activity.summary || activity.description || "Activity recorded",
    metadata: activity.metadata || {},
    createdAt: activity.createdAt,
  };
}