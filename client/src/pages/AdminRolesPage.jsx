import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, listAdminUsers, updateAdminUser } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";
import { useAuth } from "../context/AuthContext.jsx";
import Toast from "../components/Toast.jsx";

const ROLE_SECTIONS = [
  {
    role: "admin",
    title: "Administrators",
    description: "Full platform access. Can manage users, projects, roles, and system settings.",
    color: "#a07af0",
    bg: "var(--purple-soft)",
    permissions: [
      "Manage all user accounts and roles",
      "Delete any project from the platform",
      "Access system reports and analytics",
      "Promote or demote other members",
      "Suspend or reactivate accounts",
      "View all system activity logs",
    ],
  },
  {
    role: "user",
    title: "Members",
    description: "Standard workspace access. Can create and manage projects they belong to.",
    color: "#4f6ef7",
    bg: "var(--accent-soft)",
    permissions: [
      "Create and manage personal projects",
      "Invite collaborators to owned projects",
      "Create, assign, and complete tasks",
      "Comment and collaborate on tasks",
      "View team members in their projects",
      "Access personal analytics",
    ],
  },
];

export default function AdminRolesPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");
  const [toast, setToast] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminUsers({ limit: 50, page: 1, role: roleFilter || undefined });
      setUsers(res.data.items);
    } catch (e) {
      showToast(getErrorMessage(e, "Failed to load users."), "error");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleToggleAdmin(u) {
    if (u.id === currentUser?.id) {
      showToast("You cannot change your own role.", "error");
      return;
    }
    const newRole = u.systemRole === "admin" ? "user" : "admin";
    setPendingId(u.id);
    try {
      const r = await updateAdminUser(u.id, { systemRole: newRole });
      setUsers(prev => prev.map(x => x.id === u.id ? r.data.user : x));
      showToast(`${u.name} is now ${newRole === "admin" ? "an Administrator" : "a Member"}.`);
    } catch (e) {
      showToast(getErrorMessage(e, "Failed to update role."), "error");
    } finally {
      setPendingId("");
    }
  }

  async function handleToggleStatus(u) {
    if (u.id === currentUser?.id) {
      showToast("You cannot suspend your own account.", "error");
      return;
    }
    setPendingId(u.id);
    try {
      const r = await updateAdminUser(u.id, { isActive: !u.isActive });
      setUsers(prev => prev.map(x => x.id === u.id ? r.data.user : x));
      showToast(`${u.name}'s account ${r.data.user.isActive ? "activated" : "suspended"}.`);
    } catch (e) {
      showToast(getErrorMessage(e, "Failed to update status."), "error");
    } finally {
      setPendingId("");
    }
  }

  const adminCount = users.filter(u => u.systemRole === "admin").length;

  return (
    <section className="fade-in">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: "1.75rem" }}>
        <h1 className="page-title" style={{ margin: 0 }}>Roles &amp; Permissions</h1>
        <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
          Define what each role can do. Assign or revoke admin privileges for team members.
        </p>
      </div>

      {/* Role Definition Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(21rem, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        {ROLE_SECTIONS.map(s => (
          <div key={s.role} className="card" style={{ padding: "1.5rem", borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: 38, height: 38, borderRadius: "10px", background: s.bg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {s.role === "admin" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--ink)" }}>{s.title}</p>
                <p style={{ margin: 0, fontSize: "0.775rem", color: "var(--muted)", lineHeight: 1.4 }}>{s.description}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", paddingTop: "0.875rem", borderTop: "1px solid var(--border)" }}>
              {s.permissions.map(p => (
                <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--ink2)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "0.15rem", flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {p}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Role Assignment Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Role Assignments</h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>
              {adminCount} administrator{adminCount !== 1 ? "s" : ""} on the platform
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {[["", "All"], ["admin", "Admins"], ["user", "Members"]].map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={"btn btn-sm " + (roleFilter === v ? "btn-primary" : "btn-secondary")}
                onClick={() => setRoleFilter(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "1.5rem", display: "grid", gap: "0.75rem" }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: "3.25rem", borderRadius: 8 }} />)}
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)", fontSize: "0.875rem" }}>
            No users match this filter.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Member since</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: u.systemRole === "admin" ? "#7c52e8" : "#4f6ef7",
                            color: "#fff", display: "grid", placeItems: "center",
                            fontWeight: 700, fontSize: "0.825rem", flexShrink: 0,
                          }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              {u.name}
                              {isSelf && (
                                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent-text)", background: "var(--accent-soft)", padding: "1px 6px", borderRadius: "4px" }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {u.systemRole === "admin"
                          ? <span className="badge badge-purple">Admin</span>
                          : <span className="badge badge-gray">Member</span>
                        }
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 500, color: u.isActive ? "var(--green)" : "var(--muted)" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: u.isActive ? "var(--green)" : "var(--muted2)", flexShrink: 0, display: "inline-block" }} />
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                        {formatDate(u.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={isSelf || pendingId === u.id}
                            onClick={() => handleToggleAdmin(u)}
                          >
                            {u.systemRole === "admin" ? "Remove Admin" : "Make Admin"}
                          </button>
                          <button
                            type="button"
                            className={"btn btn-sm " + (u.isActive ? "btn-danger" : "btn-success")}
                            disabled={isSelf || pendingId === u.id}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.isActive ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
