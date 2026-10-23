const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(value);
}

export function publicUser(user) {
  if (!user) return null;

  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role || user.systemRole || "member",
    systemRole: user.role || user.systemRole || "member",
    department: user.department || "Engineering",
    title: user.title || "Software Engineer",
    avatarColor: user.avatarColor || "#3b82f6",
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
