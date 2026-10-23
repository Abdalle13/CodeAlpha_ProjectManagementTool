import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ProjectForm from "../components/ProjectForm.jsx";
import { addProjectMember, deleteProject, getErrorMessage, getProject, listProjectActivity, removeProjectMember, updateProject, updateProjectMember } from "../lib/api.js";
import { canManageProject, formatDate, statusLabel } from "../lib/projects.js";
import { Avatar } from "../layouts/AppLayout.jsx";

const ROLE_BADGE = { owner: "badge-purple", admin: "badge-blue", member: "badge-gray" };

function InfoTile({ label, value }) {
  return (
    <div className="card" style={{ padding: "1rem" }}>
      <p style={{ margin: "0 0 0.3rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ margin: 0, fontWeight: 600, color: "var(--ink)", fontSize: "0.9375rem" }}>{value}</p>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [project, setProject]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [notice, setNotice]         = useState("");
  const [editing, setEditing]       = useState(false);
  const [pending, setPending]       = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [memberEmail, setMEmail]    = useState("");
  const [memberRole, setMRole]      = useState("member");
  const [activity, setActivity]     = useState([]);
  const [actErr, setActErr]         = useState("");
  const [tab, setTab]               = useState("members");

  async function load() {
    setLoading(true); setError(""); setActErr("");
    try {
      const r = await getProject(id);
      setProject(r.data.project);
      try {
        const a = await listProjectActivity(id, { limit: 20 });
        setActivity(a.data.items);
      } catch (e) { setActErr(getErrorMessage(e, "Unable to load activity.")); }
    } catch (e) {
      setError(getErrorMessage(e, "Unable to load this project."));
      setProject(null);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function handleUpdate(values) {
    setPending(true); setError("");
    try {
      const r = await updateProject(id, values);
      setProject(r.data.project); setEditing(false); setNotice("Project updated.");
    } catch (e) { setError(getErrorMessage(e, "Unable to update project.")); }
    finally { setPending(false); }
  }

  async function handleDelete() {
    setPending(true); setError("");
    try { await deleteProject(id); navigate("/projects", { replace: true }); }
    catch (e) { setError(getErrorMessage(e, "Unable to delete project.")); setPending(false); setConfirmDel(false); }
  }

  async function handleAddMember(e) {
    e.preventDefault(); setPending(true); setError("");
    try {
      const r = await addProjectMember(id, { email: memberEmail, role: memberRole });
      setProject(r.data.project); setMEmail(""); setMRole("member"); setNotice("Member added.");
    } catch (e) { setError(getErrorMessage(e, "Unable to add member.")); }
    finally { setPending(false); }
  }

  async function handleRoleChange(userId, role) {
    setPending(true); setError("");
    try { const r = await updateProjectMember(id, userId, { role }); setProject(r.data.project); setNotice("Role updated."); }
    catch (e) { setError(getErrorMessage(e, "Unable to update role.")); }
    finally { setPending(false); }
  }

  async function handleRemoveMember(userId) {
    setPending(true); setError("");
    try { const r = await removeProjectMember(id, userId); setProject(r.data.project); setNotice("Member removed."); }
    catch (e) { setError(getErrorMessage(e, "Unable to remove member.")); }
    finally { setPending(false); }
  }

  const TabBtn = ({ id: tid, label }) => (
    <button type="button" onClick={() => setTab(tid)} style={{ padding: "0.5rem 1rem", background: "none", border: "none", cursor: "pointer", fontWeight: tab === tid ? 600 : 400, color: tab === tid ? "var(--ink)" : "var(--muted)", borderBottom: tab === tid ? "2px solid var(--accent)" : "2px solid transparent", fontSize: "0.875rem", transition: "color 120ms" }}>{label}</button>
  );

  if (loading) return (
    <section>
      <div className="skeleton" style={{ height: "1.5rem", width: "12rem", marginBottom: "1rem", borderRadius: 8 }} />
      <div className="skeleton" style={{ height: "2rem", width: "20rem", borderRadius: 8 }} />
    </section>
  );

  if (!project) return (
    <section>
      <p role="alert" style={{ color: "var(--red)" }}>{error || "Project not found."}</p>
      <Link to="/projects" className="btn btn-secondary" style={{ marginTop: "1rem" }}>Back to projects</Link>
    </section>
  );

  const canManage = canManageProject(project.myRole);
  const canDelete = project.myRole === "owner";

  return (
    <section className="fade-in">
      {/* Breadcrumb */}
      <p style={{ margin: "0 0 0.875rem", fontSize: "0.8125rem", color: "var(--muted)" }}>
        <Link to="/projects" style={{ color: "var(--accent-text)", fontWeight: 600, textDecoration: "none" }}>Projects</Link>
        {" / "}
        <span>{project.name}</span>
      </p>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem", maxWidth: "50rem" }}>{project.description}</p>}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {canManage && <button type="button" className="btn btn-secondary" onClick={() => setEditing(v => !v)}>{editing ? "Close editor" : "Edit project"}</button>}
          {canDelete && <button type="button" className="btn btn-danger" onClick={() => setConfirmDel(true)}>Delete</button>}
        </div>
      </div>

      {notice && <p role="status" style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--green)" }}>{notice}</p>}
      {error  && <p role="alert"  style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--red)" }}>{error}</p>}

      {/* Info tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(9rem, 1fr))", gap: "0.75rem", marginTop: "1.25rem" }}>
        <InfoTile label="Status"    value={statusLabel(project.status)} />
        <InfoTile label="Your role" value={<span style={{ textTransform: "capitalize" }}>{project.myRole}</span>} />
        <InfoTile label="Members"   value={project.members.length} />
        <InfoTile label="Due date"  value={formatDate(project.dueDate)} />
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card" style={{ marginTop: "1.25rem", padding: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>Edit project</h2>
          <ProjectForm initial={project} submitLabel="Save changes" pending={pending} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginTop: "1.5rem" }}>
        <TabBtn id="members"  label={"Members (" + project.members.length + ")"} />
        <TabBtn id="activity" label="Activity" />
      </div>

      {/* Members tab */}
      {tab === "members" && (
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th>{canManage && <th style={{ textAlign: "right" }}>Actions</th>}</tr>
              </thead>
              <tbody>
                {project.members.map(m => (
                  <tr key={m.user.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <Avatar name={m.user.name} size={28} />
                        <span style={{ fontWeight: 600, color: "var(--ink)" }}>{m.user.name}</span>
                      </div>
                    </td>
                    <td>{m.user.email}</td>
                    <td>
                      {canManage ? (
                        <select className="input" style={{ width: "8rem", height: "1.875rem", fontSize: "0.8125rem" }} value={m.role} disabled={pending} onChange={e => handleRoleChange(m.user.id, e.target.value)} aria-label={"Role for " + m.user.name}>
                          {project.myRole === "owner" && <option value="owner">Owner</option>}
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                      ) : (
                        <span className={"badge " + (ROLE_BADGE[m.role] || "badge-gray")} style={{ textTransform: "capitalize" }}>{m.role}</span>
                      )}
                    </td>
                    {canManage && (
                      <td>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} disabled={pending} onClick={() => handleRemoveMember(m.user.id)}>Remove</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canManage && (
            <form onSubmit={handleAddMember} style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.625rem", alignItems: "flex-end" }}>
              <div>
                <label className="label" htmlFor="member-email">Add member by email</label>
                <input id="member-email" className="input" type="email" value={memberEmail} onChange={e => setMEmail(e.target.value)} placeholder="colleague@example.com" required />
              </div>
              <div>
                <label className="label" htmlFor="member-role">Role</label>
                <select id="member-role" className="input" style={{ width: "8rem" }} value={memberRole} onChange={e => setMRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={pending}>Add member</button>
            </form>
          )}
        </div>
      )}

      {/* Activity tab */}
      {tab === "activity" && (
        <div style={{ marginTop: "1.25rem" }}>
          {actErr && <p role="alert" style={{ color: "var(--red)", fontSize: "0.875rem" }}>{actErr}</p>}
          {activity.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)", fontSize: "0.875rem", border: "1px dashed var(--border)", borderRadius: 12 }}>No activity recorded yet.</div>
          ) : (
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0" }}>
              {activity.map((item, i) => (
                <li key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem", padding: "0.75rem 0", borderBottom: i < activity.length - 1 ? "1px solid var(--border)" : "none", fontSize: "0.875rem" }}>
                  <p style={{ margin: 0 }}>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{item.actor?.name || "System"}</span>
                    {" "}<span style={{ color: "var(--ink2)" }}>{item.summary}</span>
                  </p>
                  <time style={{ color: "var(--muted)", whiteSpace: "nowrap", fontSize: "0.775rem", flexShrink: 0 }} dateTime={item.createdAt}>
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {confirmDel && (
        <ConfirmDialog
          title="Delete this project?"
          message={"Permanently removes " + project.name + " and all its tasks, comments, and activity. This cannot be undone."}
          confirmLabel="Delete project"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </section>
  );
}
