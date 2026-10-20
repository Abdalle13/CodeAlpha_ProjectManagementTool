export const PROJECT_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

export function statusLabel(status) {
  return PROJECT_STATUSES.find((item) => item.value === status)?.label || status;
}

export function formatDate(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function canManageProject(role) {
  return role === "owner" || role === "admin";
}
