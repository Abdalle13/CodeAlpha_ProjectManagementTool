export const PROJECT_STATUSES = [
  { value: "planning",  label: "Planning" },
  { value: "active",    label: "Active" },
  { value: "on_hold",   label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function statusLabel(status) {
  return PROJECT_STATUSES.find(s => s.value === status)?.label || (status ? status.replace("_", " ") : "—");
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function canManageProject(role) {
  return role === "owner" || role === "admin";
}
