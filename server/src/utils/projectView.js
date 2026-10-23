import { publicUser } from "./sanitize.js";

function mapUser(value) {
  if (!value) return null;
  if (value.name || value.email) return publicUser(value);
  return { id: String(value) };
}

export function publicProject(project, currentUserId, systemRole = "member") {
  const members = (project.members || []).map((member) => ({
    user: mapUser(member.user),
    role: member.role || "contributor",
    joinedAt: member.joinedAt,
  }));

  const myRole = systemRole === "admin"
    ? "admin"
    : members.find((member) => member.user?.id === String(currentUserId))?.role || null;

  return {
    id: String(project._id || project.id),
    name: project.name,
    key: project.key || "PRJ",
    description: project.description || "",
    category: project.category || "Engineering",
    status: project.status || "active",
    priority: project.priority || "medium",
    owner: mapUser(project.owner),
    members,
    startDate: project.startDate || null,
    dueDate: project.dueDate || null,
    budget: project.budget || 0,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    myRole,
  };
}
