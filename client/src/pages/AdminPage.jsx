import { useCallback, useEffect, useState } from "react";
import { deleteAdminProject, getErrorMessage, listAdminProjects, listAdminUsers, updateAdminUser } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Toast from "../components/Toast.jsx";

const ROLE_BADGE = { admin: "badge-purple", user: "badge-gray" };

export default function AdminPage() {
  const [users, setUsers]           = useState([]);
  const [projects, setProjects]     = useState([]);
  const [userPagination, setUP]     = useState(null);
  const [projPagination, setPP]     = useState(null);
  const [userQuery, setUserQuery]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [pendingId, setPendingId]   = useState("");
  const [error, setError]           = useState("");
  const [notice, setNotice]         = useState("");
  const [tab, setTab]               = useState("users");
  const [confirm, setConfirm]       = useState(null);

  const load = useCallback(async (up = 1, pp = 1, q = "") => {
    setLoading(true); setError("");
    try {
      const [ur, pr] = await Promise.all([
        listAdminUsers({ limit: 20, page: up, q: q || undefined }),
        listAdminProjects({ limit: 20, page: pp }),
      ]);
      setUsers(ur.data.items); setProjects(pr.data.items);
      setUP(ur.data.pagination); setPP(pr.data.pagination);
    } catch (e) { setError(getErrorMessage(e, "Unable to load admin data.")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUserUpdate(user, payload) {
    setPendingId(user.id);
    try {
      const r = await updateAdminUser(user.id, payload);
      setUsers(us => us.map(u => u.id === user.id ? r.data.user : u));
      setNotice(user.name + " updated.");
    } catch (e) { setError(getErrorMessage(e, "Unable to update account.")); }
    finally { setPendingId(""); }
  }

  async function deleteProject(project) {
    setPendingId(project.id); setConfirm(null);
    try {
      await deleteAdminProject(project.id);
      setProjects(ps => ps.filter(p => p.id !== project.id));
      setNotice(project.name + " deleted.");
    } catch (e) { setError(getErrorMessage(e, "Unable to delete project.")); }
    finally { setPendingId(""); }
  }

  const TabBtn = ({ id, label }) => (
    <button type="button" onClick={() => setTab(id)} style={{ padding: "0.5rem 1rem", background: "none", border: "none", cursor: "pointer", fontWeight: tab === id ? 600 : 400, color: tab === id ? "var(--ink)" : "var(--muted)", borderBottom: tab === id ? "2px solid var(--accent)" : "2px solid transparent", fontSize: "0.875rem", transition: "color 120ms" }}>{label}</button>
  );

  return (
    <section className="fade-in">
      <div>
        <h1 className="page-title">Administration</h1>
        <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>Manage accounts and projects across the platform.</p>
      </div>

      <Toast message={notice} type="success" onClose={() => setNotice("")} />
      <Toast message={error} type="error" onClose={() => setError("")} />

      {/* Summary stats */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))", gap: "0.875rem", marginTop: "1.25rem" }}>
          <div className="card" style={{ padding: "1rem" }}>
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total accounts</p>
            <p style={{ margin: 0, fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{userPagination?.total ?? users.length}</p>
          </div>
          <div className="card" style={{ padding: "1rem" }}>
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total projects</p>
            <p style={{ margin: 0, fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{projPagination?.total ?? projects.length}</p>
          </div>
          <div className="card" style={{ padding: "1rem" }}>
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Admins</p>
            <p style={{ margin: 0, fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{users.filter(u => u.systemRole === "admin").length}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginTop: "1.5rem" }}>
        <TabBtn id="users" label="Accounts" />
        <TabBtn id="projects" label="Projects" />
      </div>

      {loading ? (
        <div style={{ marginTop: "1.25rem", display: "grid", gap: "0.5rem" }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "2.5rem", borderRadius: 8 }} />)}
        </div>
      ) : tab === "users" ? (
        <section aria-labelledby="admin-users-h" style={{ marginTop: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "0.875rem" }}>
            <h2 id="admin-users-h" className="section-title">Accounts <span style={{ fontWeight: 400, color: "var(--muted)" }}>({userPagination?.total ?? users.length})</span></h2>
            <form onSubmit={e => { e.preventDefault(); load(1, projPagination?.page || 1, userQuery); }} style={{ display: "flex", gap: "0.5rem" }}>
              <input className="input" style={{ width: "15rem" }} value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="Search name or email…" aria-label="Search accounts" />
              <button type="submit" className="btn btn-secondary">Search</button>
            </form>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>No accounts found.</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600, color: "var(--ink)" }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className={"badge " + (ROLE_BADGE[u.systemRole] || "badge-gray")}>{u.systemRole === "admin" ? "Admin" : "Member"}</span></td>
                      <td><span className={"badge " + (u.isActive ? "badge-green" : "badge-red")}>{u.isActive ? "Active" : "Suspended"}</span></td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <button type="button" className="btn btn-secondary btn-sm" disabled={pendingId === u.id} onClick={() => handleUserUpdate(u, { systemRole: u.systemRole === "admin" ? "user" : "admin" })}>
                            {u.systemRole === "admin" ? "Remove admin" : "Make admin"}
                          </button>
                          <button type="button" className={"btn btn-sm " + (u.isActive ? "btn-secondary" : "btn-success")} disabled={pendingId === u.id} onClick={() => handleUserUpdate(u, { isActive: !u.isActive })}>
                            {u.isActive ? "Suspend" : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {userPagination?.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", alignItems: "center", marginTop: "0.75rem" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>Page {userPagination.page} of {userPagination.pages}</span>
              <button type="button" className="btn btn-secondary btn-sm" disabled={userPagination.page <= 1 || loading} onClick={() => load(userPagination.page - 1, projPagination?.page || 1, userQuery)}>Previous</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={userPagination.page >= userPagination.pages || loading} onClick={() => load(userPagination.page + 1, projPagination?.page || 1, userQuery)}>Next</button>
            </div>
          )}
        </section>
      ) : (
        <section aria-labelledby="admin-proj-h" style={{ marginTop: "1.25rem" }}>
          <h2 id="admin-proj-h" className="section-title" style={{ marginBottom: "0.875rem" }}>Projects <span style={{ fontWeight: 400, color: "var(--muted)" }}>({projPagination?.total ?? projects.length})</span></h2>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Owner</th><th>Members</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>No projects found.</td></tr>
                  ) : projects.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: "var(--ink)" }}>{p.name}</td>
                      <td>{p.owner?.name || "—"}</td>
                      <td>{p.members.length}</td>
                      <td style={{ textTransform: "capitalize" }}>{p.status.replace("_", " ")}</td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button type="button" className="btn btn-danger btn-sm" disabled={pendingId === p.id} onClick={() => setConfirm({ project: p })}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {projPagination?.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", alignItems: "center", marginTop: "0.75rem" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>Page {projPagination.page} of {projPagination.pages}</span>
              <button type="button" className="btn btn-secondary btn-sm" disabled={projPagination.page <= 1 || loading} onClick={() => load(userPagination?.page || 1, projPagination.page - 1, userQuery)}>Previous</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={projPagination.page >= projPagination.pages || loading} onClick={() => load(userPagination?.page || 1, projPagination.page + 1, userQuery)}>Next</button>
            </div>
          )}
        </section>
      )}

      {confirm && (
        <ConfirmDialog
          title={"Delete project: " + confirm.project.name}
          message="All tasks and data for this project will be permanently removed. This action cannot be undone."
          confirmLabel="Delete project"
          danger
          onConfirm={() => deleteProject(confirm.project)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}
