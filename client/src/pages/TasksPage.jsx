import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { createProjectTask, createTaskComment, deleteProjectTask, getErrorMessage, listTaskComments, listTasks, listProjects, updateProjectTask } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";

const COLUMNS = [
  { value: "todo",        label: "To Do",       dot: "var(--muted2)" },
  { value: "in_progress", label: "In Progress",  dot: "var(--accent)" },
  { value: "in_review",   label: "In Review",    dot: "var(--yellow)" },
  { value: "completed",   label: "Completed",    dot: "var(--green)" },
];
const PRIORITIES = ["low","medium","high","urgent"];
const PRI_BADGE  = { low: "badge-gray", medium: "badge-blue", high: "badge-yellow", urgent: "badge-red" };
const PRI_LABEL  = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };

function IconPlus()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconEdit()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconTrash() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function IconMsg()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z"/></svg>; }
function IconX()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

const emptyForm = { projectId: "", title: "", description: "", priority: "medium", assigneeId: "", dueDate: "" };

export default function TasksPage() {
  const { user }      = useAuth();
  const [projects, setProjects]   = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [form, setForm]           = useState(emptyForm);
  const [loading, setLoading]     = useState(true);
  const [pending, setPending]     = useState(false);
  const [error, setError]         = useState("");
  const [notice, setNotice]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState("");
  const [editForm, setEditForm]   = useState({});
  const [openComments, setOpenComments] = useState("");
  const [comments, setComments]         = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [filters, setFilters]           = useState({ status: "", priority: "", assignedToMe: false });
  const [pagination, setPagination]     = useState(null);

  async function load(f = filters, page = 1) {
    setLoading(true); setError("");
    try {
      const [pr, tk] = await Promise.all([
        listProjects({ limit: 50 }),
        listTasks({ page, limit: 50, status: f.status || undefined, priority: f.priority || undefined, assignedToMe: f.assignedToMe ? "true" : undefined }),
      ]);
      setProjects(pr.data.items);
      setTasks(tk.data.items);
      setPagination(tk.data.pagination);
      setForm(cf => ({ ...cf, projectId: cf.projectId || pr.data.items[0]?.id || "" }));
    } catch (e) { setError(getErrorMessage(e, "Unable to load tasks.")); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.projectId || !form.title.trim()) return;
    setPending(true); setError("");
    try {
      await createProjectTask(form.projectId, { title: form.title.trim(), description: form.description.trim(), priority: form.priority, assigneeId: form.assigneeId || null, dueDate: form.dueDate || null });
      setForm(f => ({ ...emptyForm, projectId: f.projectId }));
      setShowForm(false); setNotice("Task created.");
      await load(filters, 1);
    } catch (e) { setError(getErrorMessage(e, "Unable to create task.")); }
    finally { setPending(false); }
  }

  async function handleStatusChange(task, status) {
    setPending(true);
    try {
      const r = await updateProjectTask(task.project.id, task.id, { status });
      setTasks(ts => ts.map(t => t.id === task.id ? r.data.task : t));
    } catch (e) { setError(getErrorMessage(e, "Unable to update status.")); }
    finally { setPending(false); }
  }

  async function handleDelete(task) {
    if (!window.confirm('Delete "' + task.title + '"? This cannot be undone.')) return;
    setPending(true);
    try {
      await deleteProjectTask(task.project.id, task.id);
      setTasks(ts => ts.filter(t => t.id !== task.id));
      setNotice("Task deleted.");
    } catch (e) { setError(getErrorMessage(e, "Unable to delete task.")); }
    finally { setPending(false); }
  }

  function beginEdit(task) {
    setEditId(task.id);
    setEditForm({ title: task.title, description: task.description || "", priority: task.priority, assigneeId: task.assignee?.id || "", dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "" });
  }

  async function handleEdit(e, task, canManage) {
    e.preventDefault(); setPending(true);
    const payload = { title: editForm.title.trim(), description: editForm.description.trim(), priority: editForm.priority, dueDate: editForm.dueDate || null };
    if (canManage) payload.assigneeId = editForm.assigneeId || null;
    try {
      const r = await updateProjectTask(task.project.id, task.id, payload);
      setTasks(ts => ts.map(t => t.id === task.id ? r.data.task : t));
      setEditId(""); setNotice("Task updated.");
    } catch (e) { setError(getErrorMessage(e, "Unable to update task.")); }
    finally { setPending(false); }
  }

  async function toggleComments(task) {
    if (openComments === task.id) { setOpenComments(""); return; }
    setOpenComments(task.id);
    if (comments[task.id]) return;
    try {
      const r = await listTaskComments(task.project.id, task.id);
      setComments(c => ({ ...c, [task.id]: r.data.items }));
    } catch (e) { setError(getErrorMessage(e, "Unable to load comments.")); }
  }

  async function handleComment(e, task) {
    e.preventDefault();
    const body = (commentDraft[task.id] || "").trim();
    if (!body) return;
    setPending(true);
    try {
      const r = await createTaskComment(task.project.id, task.id, { body });
      setComments(c => ({ ...c, [task.id]: [...(c[task.id] || []), r.data.comment] }));
      setCommentDraft(d => ({ ...d, [task.id]: "" }));
    } catch (e) { setError(getErrorMessage(e, "Unable to post comment.")); }
    finally { setPending(false); }
  }

  function applyFilter(key, value) {
    const next = { ...filters, [key]: value };
    setFilters(next); load(next, 1);
  }

  const selectedProject = projects.find(p => p.id === form.projectId);

  return (
    <section className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Tasks</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>Track and manage work across your projects.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <IconPlus /> {showForm ? "Collapse" : "Add task"}
        </button>
      </div>

      {/* New task form */}
      {showForm && (
        <div className="card" style={{ marginTop: "1.25rem", padding: "1.25rem" }}>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))", gap: "0.75rem", alignItems: "end" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label" htmlFor="task-title">Task title *</label>
              <input id="task-title" className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" minLength={2} maxLength={160} required />
            </div>
            <div>
              <label className="label" htmlFor="task-project">Project *</label>
              <select id="task-project" className="input" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value, assigneeId: "" }))} required>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="task-priority">Priority</label>
              <select id="task-priority" className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRI_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="task-assignee">Assignee</label>
              <select id="task-assignee" className="input" value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
                <option value="">Unassigned</option>
                {selectedProject?.members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="task-due">Due date</label>
              <input id="task-due" className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
              <button type="submit" className="btn btn-primary" disabled={pending || !projects.length}>{pending ? "Saving…" : "Add task"}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", alignItems: "center", marginTop: "1.25rem", padding: "0.75rem 1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
        <div>
          <label className="label" htmlFor="filter-status" style={{ display: "inline" }}>Status: </label>
          <select id="filter-status" className="input" style={{ width: "auto", display: "inline-block", marginLeft: "0.4rem" }} value={filters.status} onChange={e => applyFilter("status", e.target.value)}>
            <option value="">All</option>
            {COLUMNS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="filter-priority" style={{ display: "inline" }}>Priority: </label>
          <select id="filter-priority" className="input" style={{ width: "auto", display: "inline-block", marginLeft: "0.4rem" }} value={filters.priority} onChange={e => applyFilter("priority", e.target.value)}>
            <option value="">All</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{PRI_LABEL[p]}</option>)}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer", color: "var(--ink2)" }}>
          <input type="checkbox" checked={filters.assignedToMe} onChange={e => applyFilter("assignedToMe", e.target.checked)} />
          Assigned to me
        </label>
        {pagination && <span style={{ marginLeft: "auto", fontSize: "0.775rem", color: "var(--muted)" }}>{pagination.total} task{pagination.total !== 1 ? "s" : ""}</span>}
      </div>

      {notice && <p role="status" style={{ marginTop: "0.625rem", fontSize: "0.8125rem", color: "var(--green)" }}>{notice}</p>}
      {error  && <p role="alert"  style={{ marginTop: "0.625rem", fontSize: "0.8125rem", color: "var(--red)" }}>{error}</p>}

      {/* Kanban board */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem", marginTop: "1.25rem" }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "12rem", borderRadius: 12 }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ marginTop: "2rem", textAlign: "center", padding: "2.5rem", borderRadius: 14, border: "2px dashed var(--border)", background: "var(--surface)" }}>
          <p style={{ fontWeight: 600, margin: "0 0 0.5rem" }}>No projects yet</p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Create a project before adding tasks.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(14rem, 1fr))", gap: "0.875rem", marginTop: "1.25rem", overflowX: "auto" }}>
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.value || (col.value === "completed" && t.status === "done"));
              return (
                <div key={col.value} className="kanban-col" style={{ padding: "0.875rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot, display: "inline-block" }} />
                    <span style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{col.label}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, background: "var(--border)", borderRadius: 99, padding: "1px 7px" }}>{colTasks.length}</span>
                  </div>
                  <div style={{ display: "grid", gap: "0.625rem" }}>
                    {colTasks.map(task => {
                      const proj = projects.find(p => p.id === task.project.id);
                      const canDelete  = ["owner","admin"].includes(proj?.myRole) || task.createdBy?.id === user?.id;
                      const canManage  = ["owner","admin"].includes(proj?.myRole);
                      const canEdit    = canManage || task.createdBy?.id === user?.id || task.assignee?.id === user?.id;
                      const isEditing  = editId === task.id;
                      const hasComment = openComments === task.id;
                      return (
                        <div key={task.id} className="kanban-card">
                          {/* Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.375rem" }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.35, color: "var(--ink)" }}>{task.title}</p>
                            <span className={"badge " + (PRI_BADGE[task.priority] || "badge-gray")} style={{ flexShrink: 0 }}>{PRI_LABEL[task.priority] || task.priority}</span>
                          </div>
                          {task.description && <p style={{ margin: "0 0 0.5rem", fontSize: "0.775rem", color: "var(--muted)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{task.description}</p>}
                          <p style={{ margin: "0 0 0.125rem", fontSize: "0.725rem", color: "var(--muted)", fontWeight: 500 }}>{task.project.name}</p>
                          <p style={{ margin: "0 0 0.625rem", fontSize: "0.725rem", color: "var(--muted2)" }}>
                            {task.assignee ? task.assignee.name : "Unassigned"}{task.dueDate ? " · " + formatDate(task.dueDate) : ""}
                          </p>

                          {/* Status select */}
                          <select className="input" style={{ fontSize: "0.775rem", height: "1.875rem" }} value={task.status === "done" ? "completed" : task.status} disabled={pending} onChange={e => handleStatusChange(task, e.target.value)} aria-label={"Status for " + task.title}>
                            {COLUMNS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                            {canEdit && (
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => isEditing ? setEditId("") : beginEdit(task)} title="Edit task">
                                {isEditing ? <IconX /> : <IconEdit />} {isEditing ? "Close" : "Edit"}
                              </button>
                            )}
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggleComments(task)} title="Comments">
                              <IconMsg /> {hasComment ? "Hide" : "Comments"}
                            </button>
                            {canDelete && (
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(task)} disabled={pending} title="Delete task" style={{ color: "var(--red)" }}>
                                <IconTrash />
                              </button>
                            )}
                          </div>

                          {/* Edit form */}
                          {isEditing && (
                            <form onSubmit={e => handleEdit(e, task, canManage)} style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", display: "grid", gap: "0.5rem" }}>
                              <div>
                                <label className="label" htmlFor={"et-" + task.id}>Title</label>
                                <input id={"et-" + task.id} className="input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required minLength={2} maxLength={160} />
                              </div>
                              <div>
                                <label className="label" htmlFor={"ed-" + task.id}>Description</label>
                                <textarea id={"ed-" + task.id} className="input" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={{ minHeight: "3.5rem" }} />
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                                <div>
                                  <label className="label" htmlFor={"ep-" + task.id}>Priority</label>
                                  <select id={"ep-" + task.id} className="input" value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                                    {PRIORITIES.map(p => <option key={p} value={p}>{PRI_LABEL[p]}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="label" htmlFor={"edu-" + task.id}>Due date</label>
                                  <input id={"edu-" + task.id} className="input" type="date" value={editForm.dueDate} onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))} />
                                </div>
                              </div>
                              {canManage && (
                                <div>
                                  <label className="label" htmlFor={"ea-" + task.id}>Assignee</label>
                                  <select id={"ea-" + task.id} className="input" value={editForm.assigneeId} onChange={e => setEditForm(f => ({ ...f, assigneeId: e.target.value }))}>
                                    <option value="">Unassigned</option>
                                    {proj?.members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                                  </select>
                                </div>
                              )}
                              <button type="submit" className="btn btn-primary btn-sm" style={{ justifySelf: "flex-end" }} disabled={pending}>{pending ? "Saving…" : "Save"}</button>
                            </form>
                          )}

                          {/* Comments */}
                          {hasComment && (
                            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                              {(comments[task.id] || []).length === 0 ? (
                                <p style={{ fontSize: "0.775rem", color: "var(--muted)", margin: "0 0 0.5rem" }}>No comments yet.</p>
                              ) : (
                                <ul style={{ margin: "0 0 0.625rem", padding: 0, listStyle: "none", display: "grid", gap: "0.5rem" }}>
                                  {(comments[task.id] || []).map(c => (
                                    <li key={c.id} style={{ fontSize: "0.78rem" }}>
                                      <p style={{ margin: "0 0 0.1rem", fontWeight: 600, color: "var(--ink2)" }}>{c.author.name}</p>
                                      <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.4 }}>{c.body}</p>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <form onSubmit={e => handleComment(e, task)} style={{ display: "flex", gap: "0.4rem" }}>
                                <input className="input" style={{ flex: 1, fontSize: "0.78rem", height: "1.875rem" }} placeholder="Add a comment…" value={commentDraft[task.id] || ""} onChange={e => setCommentDraft(d => ({ ...d, [task.id]: e.target.value }))} maxLength={2000} required />
                                <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>Post</button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div style={{ padding: "1.25rem", textAlign: "center", border: "1.5px dashed var(--border)", borderRadius: 10, fontSize: "0.78rem", color: "var(--muted2)" }}>
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {pagination?.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className="btn btn-secondary btn-sm" disabled={loading || pagination.page <= 1} onClick={() => load(filters, pagination.page - 1)}>Previous</button>
              <span style={{ display: "flex", alignItems: "center", fontSize: "0.8125rem", color: "var(--muted)" }}>Page {pagination.page} of {pagination.pages}</span>
              <button type="button" className="btn btn-secondary btn-sm" disabled={loading || pagination.page >= pagination.pages} onClick={() => load(filters, pagination.page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
