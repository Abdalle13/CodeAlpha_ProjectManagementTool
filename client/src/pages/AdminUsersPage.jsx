import { useCallback, useEffect, useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  getErrorMessage,
  listAdminUsers,
  updateAdminUser,
} from "../lib/api.js";
import { formatDate } from "../lib/projects.js";
import { useAuth } from "../context/AuthContext.jsx";

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        position: "fixed",
        top: "1.25rem",
        right: "1.5rem",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        background: type === "success" ? "var(--green)" : "var(--red)",
        color: "#fff",
        borderRadius: "10px",
        padding: "0.75rem 1.1rem",
        fontSize: "0.875rem",
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        animation: "slide-up 200ms ease",
        maxWidth: "26rem",
      }}
    >
      {type === "success" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      )}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, opacity: 0.85, display: "flex", alignItems: "center" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

const ROLE_BADGE = {
  admin: "badge-purple",
  manager: "badge-blue",
  member: "badge-gray",
  user: "badge-gray",
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");
  const [toast, setToast] = useState(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    isActive: true,
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "user",
    isActive: true,
    password: "",
  });

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const load = useCallback(
    async (page = 1, q = query, role = roleFilter, status = statusFilter) => {
      setLoading(true);
      try {
        const res = await listAdminUsers({
          limit: 15,
          page,
          q: q || undefined,
          role: role || undefined,
          status: status || undefined,
        });
        setUsers(res.data.items);
        setPagination(res.data.pagination);
      } catch (e) {
        showToast(getErrorMessage(e, "Unable to load users directory."), "error");
      } finally {
        setLoading(false);
      }
    },
    [query, roleFilter, statusFilter]
  );

  useEffect(() => {
    load(1);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load(1, query, roleFilter, statusFilter);
  }

  // Quick toggle status (Suspend / Activate)
  async function handleToggleStatus(targetUser) {
    if (targetUser.id === currentUser?.id) {
      showToast("You cannot suspend your own account.", "error");
      return;
    }
    setPendingId(targetUser.id);
    try {
      const res = await updateAdminUser(targetUser.id, { isActive: !targetUser.isActive });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? res.data.user : u)));
      showToast(`${targetUser.name}'s account has been ${res.data.user.isActive ? "activated" : "suspended"}.`);
    } catch (e) {
      showToast(getErrorMessage(e, "Failed to update account status."), "error");
    } finally {
      setPendingId("");
    }
  }

  // CREATE USER
  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (createForm.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createAdminUser(createForm);
      showToast(`User account created for ${res.data.user.name}.`);
      setCreateModalOpen(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "user",
        isActive: true,
      });
      load(1);
    } catch (e) {
      showToast(getErrorMessage(e, "Could not create user account."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  // EDIT USER OPEN
  function openEditModal(u) {
    setEditingUser(u);
    setEditForm({
      name: u.name || "",
      email: u.email || "",
      role: u.systemRole === "admin" ? "admin" : (u.role || "user"),
      isActive: Boolean(u.isActive),
      password: "",
    });
  }

  // EDIT USER SUBMIT
  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) {
      showToast("Name and email are required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
      };

      // Only pass role/status if not editing self
      if (editingUser.id !== currentUser?.id) {
        payload.role = editForm.role;
        payload.systemRole = editForm.role === "admin" ? "admin" : "user";
        payload.isActive = editForm.isActive;
      }

      if (editForm.password && editForm.password.trim().length >= 6) {
        payload.password = editForm.password.trim();
      }

      const res = await updateAdminUser(editingUser.id, payload);
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? res.data.user : u)));
      showToast(`Account details for ${res.data.user.name} updated.`);
      setEditingUser(null);
    } catch (e) {
      showToast(getErrorMessage(e, "Failed to save user updates."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  // DELETE USER
  async function handleDeleteConfirm() {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser?.id) {
      showToast("You cannot delete your own account.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await deleteAdminUser(deletingUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      showToast(`User ${deletingUser.name} was permanently removed.`);
      setDeletingUser(null);
      if (pagination && pagination.total > 0) {
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (e) {
      showToast(getErrorMessage(e, "Failed to delete user."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Quick stats
  const totalCount = pagination?.total || users.length;
  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.systemRole === "admin" || u.role === "admin").length;

  return (
    <section className="fade-in" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "2rem" }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header with Title and Add User Action */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Users Management</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            Create, manage accounts, update user details, and monitor directory access.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setCreateModalOpen(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Add New User
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.875rem",
          marginBottom: "1.25rem",
        }}
      >
        <div className="card" style={{ padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>Total Accounts</span>
          <span style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--ink)" }}>{totalCount}</span>
        </div>
        <div className="card" style={{ padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>Active Members</span>
          <span style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--green)" }}>{activeCount}</span>
        </div>
        <div className="card" style={{ padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>Administrators</span>
          <span style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--purple)" }}>{adminCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: "0.875rem 1rem",
          marginBottom: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: "1 1 18rem", minWidth: 0 }}>
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search users"
          />
          <button type="submit" className="btn btn-secondary" style={{ flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="input"
            style={{ width: "auto", minWidth: "8.5rem" }}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              load(1, query, e.target.value, statusFilter);
            }}
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Regular Members</option>
            <option value="manager">Managers</option>
          </select>

          <select
            className="input"
            style={{ width: "auto", minWidth: "8.5rem" }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              load(1, query, roleFilter, e.target.value);
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Data Table with Responsive Horizontal Scroll */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
        {loading ? (
          <div style={{ padding: "1.5rem", display: "grid", gap: "0.75rem" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: "3rem", borderRadius: 8 }} />
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table className="data-table" style={{ width: "100%", minWidth: "680px" }}>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: "right" }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "2.75rem" }}>
                      No user accounts found matching your query.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isAdmin = u.systemRole === "admin" || u.role === "admin";
                    return (
                      <tr key={u.id}>
                        {/* User Details */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: u.avatarColor || (isAdmin ? "#7c52e8" : "#4f6ef7"),
                                color: "#fff",
                                display: "grid",
                                placeItems: "center",
                                fontWeight: 700,
                                fontSize: "0.8125rem",
                                flexShrink: 0,
                              }}
                            >
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                                {isSelf && (
                                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--accent-text)", background: "var(--accent-soft)", padding: "1px 5px", borderRadius: "4px" }}>
                                    You
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "0.775rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          <span className={"badge " + (ROLE_BADGE[u.systemRole] || ROLE_BADGE[u.role] || "badge-gray")}>
                            {isAdmin ? "Admin" : u.role === "manager" ? "Manager" : "Member"}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8125rem", fontWeight: 500, color: u.isActive ? "var(--green)" : "var(--muted)" }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: u.isActive ? "var(--green)" : "var(--muted2)", flexShrink: 0, display: "inline-block" }} />
                            {u.isActive ? "Active" : "Suspended"}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td style={{ fontSize: "0.8125rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                          {formatDate(u.createdAt)}
                        </td>

                        {/* Actions (CRUD: Edit, Suspend/Activate, Delete) */}
                        <td>
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", alignItems: "center" }}>
                            {/* Edit Button */}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              title="Edit user details"
                              onClick={() => openEditModal(u)}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </button>

                            {/* Suspend / Activate toggle (soft red / soft green) */}
                            <button
                              type="button"
                              className={"btn btn-sm " + (u.isActive ? "btn-danger" : "btn-success")}
                              disabled={isSelf || pendingId === u.id}
                              onClick={() => handleToggleStatus(u)}
                              title={u.isActive ? "Suspend user access" : "Activate user account"}
                            >
                              {u.isActive ? "Suspend" : "Activate"}
                            </button>

                            {/* Delete User (soft red) */}
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={isSelf || pendingId === u.id}
                              onClick={() => setDeletingUser(u)}
                              title={isSelf ? "Cannot delete your own account" : "Delete user permanently"}
                              style={{ padding: "0 0.5rem" }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            Page {pagination.page} of {pagination.pages} ({pagination.total} accounts)
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1 || loading}
              onClick={() => load(pagination.page - 1, query, roleFilter, statusFilter)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => load(pagination.page + 1, query, roleFilter, statusFilter)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE USER MODAL
      ───────────────────────────────────────────────────────────── */}
      {createModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            padding: "1rem",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setCreateModalOpen(false);
          }}
        >
          <div
            className="card-raised fade-in"
            style={{
              width: "100%",
              maxWidth: "32rem",
              background: "var(--surface)",
              borderRadius: "14px",
              overflow: "hidden",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: 34, height: 34, borderRadius: "8px", background: "var(--accent-soft)", color: "var(--accent-text)", display: "grid", placeItems: "center" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>Create New User</h2>
                  <p style={{ margin: 0, fontSize: "0.775rem", color: "var(--muted)" }}>Add a new team member to the platform</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: "0.3rem" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Full Name *</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Sarah Connor"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Email Address *</label>
                <input
                  required
                  type="email"
                  className="input"
                  placeholder="e.g. sarah@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Initial Password * (minimum 6 characters)</label>
                <input
                  required
                  type="password"
                  className="input"
                  placeholder="Create a secure password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div>
                <label className="label">System Role</label>
                <select
                  className="input"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="user">Regular Member</option>
                  <option value="admin">Administrator</option>
                  <option value="manager">Project Manager</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.25rem" }}>
                <input
                  type="checkbox"
                  id="create-active-check"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }}
                />
                <label htmlFor="create-active-check" style={{ fontSize: "0.85rem", color: "var(--ink)", cursor: "pointer", userSelect: "none" }}>
                  Account is immediately active
                </label>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={submitting}
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EDIT USER MODAL
      ───────────────────────────────────────────────────────────── */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            padding: "1rem",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setEditingUser(null);
          }}
        >
          <div
            className="card-raised fade-in"
            style={{
              width: "100%",
              maxWidth: "32rem",
              background: "var(--surface)",
              borderRadius: "14px",
              overflow: "hidden",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: 34, height: 34, borderRadius: "8px", background: "var(--accent-soft)", color: "var(--accent-text)", display: "grid", placeItems: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>Edit Account</h2>
                  <p style={{ margin: 0, fontSize: "0.775rem", color: "var(--muted)" }}>Updating profile and access for {editingUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn btn-ghost btn-sm"
                style={{ padding: "0.3rem" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Full Name *</label>
                <input
                  required
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Email Address *</label>
                <input
                  required
                  type="email"
                  className="input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={editForm.role}
                  disabled={editingUser.id === currentUser?.id}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="user">Regular Member</option>
                  <option value="admin">Administrator</option>
                  <option value="manager">Project Manager</option>
                </select>
                {editingUser.id === currentUser?.id && (
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block", marginTop: "0.25rem" }}>
                    Cannot change own role
                  </span>
                )}
              </div>

              <div>
                <label className="label">Reset Password (optional)</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Leave blank to keep existing password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
              </div>

              {editingUser.id !== currentUser?.id && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.25rem" }}>
                  <input
                    type="checkbox"
                    id="edit-active-check"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }}
                  />
                  <label htmlFor="edit-active-check" style={{ fontSize: "0.85rem", color: "var(--ink)", cursor: "pointer", userSelect: "none" }}>
                    Account status: Active (uncheck to suspend account)
                  </label>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={submitting}
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DELETE CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {deletingUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            padding: "1rem",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setDeletingUser(null);
          }}
        >
          <div
            className="card-raised fade-in"
            style={{
              width: "100%",
              maxWidth: "28rem",
              background: "var(--surface)",
              borderRadius: "14px",
              padding: "1.5rem",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--red-soft)",
                  color: "var(--red)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>Delete User Account</h3>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>Permanent removal</p>
              </div>
            </div>

            <p style={{ fontSize: "0.875rem", color: "var(--ink2)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
              Are you sure you want to permanently delete <strong>{deletingUser.name}</strong> ({deletingUser.email})?
              This action cannot be undone and will remove their system access.
            </p>

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => setDeletingUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={submitting}
                onClick={handleDeleteConfirm}
              >
                {submitting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
