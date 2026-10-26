import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { createProjectTask, createTaskComment, deleteProjectTask, getErrorMessage, listTaskComments, listTasks, listProjects, listTeamMembers, updateProjectTask } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";
import TaskModal from "../components/TaskModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const COLUMNS = [
  { value: "todo",        label: "To Do",       dot: "var(--muted2)" },
  { value: "in_progress", label: "In Progress",  dot: "var(--accent)" },
  { value: "in_review",   label: "In Review",    dot: "var(--yellow)" },
  { value: "completed",   label: "Completed",    dot: "var(--green)" },
];



function IconEdit()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconTrash() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function IconMsg()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z"/></svg>; }

export default function TasksPage() {
  const { user }                  = useAuth();
  const [projects, setProjects]   = useState([]);
  const [members, setMembers]     = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [pending, setPending]     = useState(false);
  const [error, setError]         = useState("");
  const [notice, setNotice]       = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode]   = useState("board"); // 'board' | 'table'
  const [filters, setFilters]     = useState({ status: "", assignedToMe: false });
  const [openComments, setOpenComments] = useState("");
  const [comments, setComments]         = useState({});
  const [commentDraft, setCommentDraft] = useState({});

  async function load(f = filters) {
    setLoading(true);
    setError("");
    try {
      const [pr, tk, tm] = await Promise.all([
        listProjects({ limit: 50 }),
        listTasks({ limit: 50, status: f.status || undefined, assignedToMe: f.assignedToMe ? "true" : undefined }),
        listTeamMembers().catch(() => ({ data: { items: [] } })),
      ]);
      setProjects(pr.data.items);
      setTasks(tk.data.items);
      setMembers(tm.data.items);
    } catch (e) {
      setError(getErrorMessage(e, "Unable to load tasks."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function applyFilter(key, val) {
    const updated = { ...filters, [key]: val };
    setFilters(updated);
    load(updated);
  }

  async function handleModalSubmit(payload) {
    setPending(true);
    setError("");
    triggerNotice("");
    try {
      if (editTarget) {
        await updateProjectTask(editTarget.project.id, editTarget.id, payload);
        triggerNotice(`Task updated successfully.`);
      } else {
        await createProjectTask(payload.projectId, payload);
        triggerNotice(`Task created successfully.`);
      }
      setModalOpen(false);
      setEditTarget(null);
      await load();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to save task."));
    } finally {
      setPending(false);
    }
  }

  async function handleStatusChange(task, newStatus) {
    setPending(true);
    try {
      await updateProjectTask(task.project.id, task.id, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (e) {
      setError(getErrorMessage(e, "Could not update status."));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    try {
      await deleteProjectTask(deleteTarget.project.id, deleteTarget.id);
      triggerNotice("Task deleted.");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(getErrorMessage(e, "Could not delete task."));
    } finally {
      setPending(false);
    }
  }

  async function toggleComments(task) {
    if (openComments === task.id) {
      setOpenComments("");
      return;
    }
    setOpenComments(task.id);
    if (!comments[task.id]) {
      try {
        const res = await listTaskComments(task.project.id, task.id);
        setComments(c => ({ ...c, [task.id]: res.data.items }));
      } catch (e) {
        setError(getErrorMessage(e, "Unable to load comments."));
      }
    }
  }

  async function handleAddComment(e, task) {
    e.preventDefault();
    const body = String(commentDraft[task.id] || "").trim();
    if (!body) return;
    try {
      const res = await createTaskComment(task.project.id, task.id, body);
      setComments(c => ({ ...c, [task.id]: [...(c[task.id] || []), res.data.comment] }));
      setCommentDraft(d => ({ ...d, [task.id]: "" }));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to post comment."));
    }
  }

  return (
    <section className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Tasks</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            Track your workflows, manage sprint backlogs, and collaborate across status columns.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
          disabled={projects.length === 0}
        >
          + Add task
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="card" style={{ padding: "0.875rem 1rem", display: "flex", gap: "0.875rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <label className="label" htmlFor="filter-status" style={{ margin: 0 }}>Status:</label>
            <select id="filter-status" className="input" style={{ width: "auto" }} value={filters.status} onChange={e => applyFilter("status", e.target.value)}>
              <option value="">All</option>
              {COLUMNS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer", color: "var(--ink2)" }}>
            <input type="checkbox" checked={filters.assignedToMe} onChange={e => applyFilter("assignedToMe", e.target.checked)} />
            Assigned to me
          </label>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
          <button
            type="button"
            onClick={() => setViewMode("board")}
            style={{
              padding: "0.35rem 0.65rem",
              background: viewMode === "board" ? "var(--accent)" : "var(--surface)",
              color: viewMode === "board" ? "#fff" : "var(--muted)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            style={{
              padding: "0.35rem 0.65rem",
              background: viewMode === "table" ? "var(--accent)" : "var(--surface)",
              color: viewMode === "table" ? "#fff" : "var(--muted)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            Table
          </button>
        </div>
      </div>

      {notice && (
        <div
          style={{
            position: "fixed",
            top: "1.25rem",
            right: "1.5rem",
            zIndex: 100,
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid #10b981",
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            animation: "fade-in 200ms ease",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          <span style={{ color: "#10b981", fontWeight: 700, fontSize: "1.1rem" }}>✓</span>
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem", marginLeft: "0.5rem" }}
          >
            ×
          </button>
        </div>
      )}
      {error && <p role="alert" style={{ color: "var(--red)", fontSize: "0.8125rem" }}>{error}</p>}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: "14rem", borderRadius: "12px" }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
          <p style={{ fontWeight: 600, margin: "0 0 0.5rem" }}>No projects available</p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Create a project first to begin tracking sprint tasks.</p>
        </div>
      ) : viewMode === "board" ? (
        /* Kanban Board View with Responsive Scroll-Snapping */
        <div className="kanban-board-scroll">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.value || (col.value === "completed" && t.status === "done"));
            return (
              <div key={col.value} className="kanban-col" style={{ padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot }} />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--ink)" }}>{col.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, background: "var(--border)", borderRadius: "99px", padding: "1px 8px" }}>
                    {colTasks.length}
                  </span>
                </div>

                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {colTasks.length === 0 ? (
                    <div style={{ border: "2px dashed var(--border)", borderRadius: "10px", padding: "1.75rem 1rem", textAlign: "center", color: "var(--muted)", fontSize: "0.78rem" }}>
                      No tasks
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const hasComment = openComments === task.id;
                      return (
                        <div key={task.id} className="kanban-card">
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", lineHeight: 1.35, color: "var(--ink)" }}>
                              {task.title}
                            </p>

                          {task.description && (
                            <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {task.description}
                            </p>
                          )}

                          <p style={{ margin: "0 0 0.15rem", fontSize: "0.725rem", color: "var(--muted)", fontWeight: 600 }}>
                            {task.project?.name}
                          </p>
                          <p style={{ margin: "0 0 0.75rem", fontSize: "0.725rem", color: "var(--muted2)" }}>
                            {task.assignee ? task.assignee.name : "Unassigned"}{task.dueDate ? " • " + formatDate(task.dueDate) : ""}
                          </p>

                          {/* Quick Status Select */}
                          <select
                            className="input"
                            style={{ fontSize: "0.775rem", height: "1.9rem", marginBottom: "0.5rem" }}
                            value={task.status === "done" ? "completed" : task.status}
                            disabled={pending}
                            onChange={e => handleStatusChange(task, e.target.value)}
                          >
                            {COLUMNS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>

                          <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => { setEditTarget(task); setModalOpen(true); }}
                              title="Edit task"
                            >
                              <IconEdit /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => toggleComments(task)}
                              title="Comments"
                            >
                              <IconMsg /> {hasComment ? "Hide" : "Comments"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: "var(--red)", marginLeft: "auto" }}
                              onClick={() => setDeleteTarget(task)}
                              title="Delete task"
                            >
                              <IconTrash />
                            </button>
                          </div>

                          {/* Inline Comments */}
                          {hasComment && (
                            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", display: "grid", gap: "0.5rem" }}>
                              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)" }}>Comments</p>
                              <div style={{ display: "grid", gap: "0.35rem", maxHeight: "8rem", overflowY: "auto" }}>
                                {(comments[task.id] || []).length === 0 ? (
                                  <p style={{ margin: 0, fontSize: "0.725rem", color: "var(--muted)" }}>No comments yet.</p>
                                ) : (
                                  comments[task.id].map(c => (
                                    <div key={c.id} style={{ background: "var(--surface2)", padding: "0.4rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem" }}>
                                      <span style={{ fontWeight: 600 }}>{c.author?.name}: </span>
                                      <span>{c.content || c.body}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                              <form onSubmit={e => handleAddComment(e, task)} style={{ display: "flex", gap: "0.35rem" }}>
                                <input
                                  className="input"
                                  style={{ flex: 1, fontSize: "0.75rem", height: "1.85rem" }}
                                  placeholder="Add a comment…"
                                  value={commentDraft[task.id] || ""}
                                  onChange={e => setCommentDraft(d => ({ ...d, [task.id]: e.target.value }))}
                                  required
                                />
                                <button type="submit" className="btn btn-primary btn-sm">Post</button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <>
          {/* Desktop Table View (>= 641px) */}
          <div className="card tasks-desktop-table" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table className="table" style={{ width: "100%", minWidth: "860px" }}>
                <thead>
                  <tr>
                    <th className="nowrap" style={{ width: "6.5rem" }}>Code</th>
                    <th style={{ minWidth: "14rem" }}>Task Title</th>
                    <th style={{ minWidth: "11rem" }}>Project</th>
                    <th className="nowrap" style={{ width: "7.5rem" }}>Status</th>
                    <th className="nowrap" style={{ width: "9rem" }}>Assignee</th>
                    <th className="nowrap" style={{ width: "8rem" }}>Due Date</th>
                    <th className="nowrap" style={{ width: "5rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: "2.5rem" }}>
                        No tasks found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    tasks.map(t => (
                      <tr key={t.id}>
                        <td className="nowrap" style={{ fontWeight: 700, color: "var(--accent)" }}>{t.taskCode || "TASK"}</td>
                        <td style={{ fontWeight: 600, color: "var(--ink)" }}>{t.title}</td>
                        <td style={{ color: "var(--muted)" }}>{t.project?.name}</td>
                        <td className="nowrap">
                          <span className={"badge " + (t.status === "completed" || t.status === "done" ? "badge-green" : t.status === "in_progress" ? "badge-blue" : "badge-gray")}>
                            {t.status}
                          </span>
                        </td>
                        <td className="nowrap">{t.assignee?.name || "Unassigned"}</td>
                        <td className="nowrap">{t.dueDate ? formatDate(t.dueDate) : "—"}</td>
                        <td className="nowrap" style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setEditTarget(t); setModalOpen(true); }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Task Card List (< 640px) */}
          <div className="tasks-mobile-list">
            {tasks.length === 0 ? (
              <div className="card" style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--muted)" }}>
                No tasks found matching your filters.
              </div>
            ) : (
              tasks.map(t => (
                <div key={t.id} className="card" style={{ padding: "1.125rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: "6px" }}>
                      {t.taskCode || "TASK"}
                    </span>
                    <span className={"badge " + (t.status === "completed" || t.status === "done" ? "badge-green" : t.status === "in_progress" ? "badge-blue" : "badge-gray")}>
                      {t.status}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ margin: "0 0 0.2rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.35 }}>
                      {t.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>
                      {t.project?.name || "Workspace"}
                    </p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "0.65rem", marginTop: "0.25rem", fontSize: "0.78rem" }}>
                    <span style={{ color: "var(--ink2)", fontWeight: 500 }}>
                      👤 {t.assignee?.name || "Unassigned"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      {t.dueDate && (
                        <span style={{ color: "var(--muted)", fontSize: "0.725rem" }}>
                          {formatDate(t.dueDate)}
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ height: "1.75rem", padding: "0 0.65rem", fontSize: "0.75rem" }}
                        onClick={() => { setEditTarget(t); setModalOpen(true); }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Task Modal */}
      <TaskModal
        open={modalOpen}
        initial={editTarget}
        projects={projects}
        members={members}
        pending={pending}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {/* Confirm Delete */}
      {Boolean(deleteTarget) && (
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete task?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete task"
        danger
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      )}
    </section>
  );
}
