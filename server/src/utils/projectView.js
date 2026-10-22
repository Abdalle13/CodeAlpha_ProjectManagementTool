import { publicUser } from "./sanitize.js";

function mapUser(value) {
  if (!value) return null;
  if (value.name || value.email) return publicUser(value);
  return { id: String(value) };
}

export function publicProject(project, currentUserId, systemRole = "user") {
  const members = (project.members || []).map((member) => ({
    user: mapUser(member.user),
    role: member.role,
    joinedAt: member.joinedAt,
  }));

  const myRole = systemRole === "admin"
    ? "admin"
    : members.find((member) => member.user?.id === String(currentUserId))?.role || null;

  return {
    id: String(project._id || project.id),
    name: project.name,
    description: project.description,
    status: project.status,
    owner: mapUser(project.owner),
    members,
    startDate: project.startDate,
    dueDate: project.dueDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    myRole,
  };
}
