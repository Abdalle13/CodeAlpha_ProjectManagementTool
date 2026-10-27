import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ProjectForm from "../components/ProjectForm.jsx";
import TaskModal from "../components/TaskModal.jsx";
import Toast from "../components/Toast.jsx";
import {
  addProjectMember,
  createProjectTask,
  deleteProject,
  deleteProjectTask,
  getErrorMessage,
  getProject,
  listProjectActivity,
  listProjectTasks,
  removeProjectMember,
  updateProject,
  updateProjectMember,
  updateProjectTask,
} from "../lib/api.js";
import { canManageProject, formatDate, statusLabel, projectStatusBadge } from "../lib/projects.js";
import { Avatar } from "../layouts/AppLayout.jsx";

const ROLE_BADGE = { owner: "badge-purple", admin: "badge-blue", member: "badge-gray", lead: "badge-purple", contributor: "badge-gray" };
const ROLE_LABEL = { owner: "Project Lead", admin: "Manager", member: "Team Member", lead: "Project Lead", contributor: "Contributor" };

const COLUMNS = [
  { value: "todo",        label: "To Do",       dot: "#94a3b8" },
  { value: "in_progress", label: "In Progress", dot: "#3b82f6" },
  { value: "in_review",   label: "In Review",   dot: "#f59e0b" },
  { value: "completed",   label: "Completed",   dot: "#10b981" },
];

function InfoTile({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: "1.125rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <p style={{ margin: "0 0 0.35rem", fontSize: "0.725rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontWeight: 800, color: accent || "var(--ink)", fontSize: "1.25rem", lineHeight: 1.2 }}>
        {value}
      </p>
      {sub && <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.35rem" }}>{sub}</span>}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();

  const [project, setProject]       = useState(null);
  const [tasks, setTasks]           = useState([]);
  const [activity, setActivity]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);
  const [taskModalError, setTaskModalError] = useState("");

  const [tab, setTab]               = useState("tasks"); // 'tasks' is default!
  const [viewMode, setViewMode]     = useState("board"); // 'board' | 'table'
  const [taskFilter, setTaskFilter] = useState("");
  const [taskSearch, setTaskSearch] = useState("");

  // Modals & form state
  const [editing, setEditing]             = useState(false);
  const [pending, setPending]             = useState(false);
  const [confirmDel, setConfirmDel]       = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editTaskTarget, setEditTaskTarget] = useState(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);

  // Add member state
  const [memberEmail, setMEmail] = useState("");
  const [memberRole, setMRole]   = useState("member");

  const showToast = (message, type = "success") => setToast({ message, type });

  async function load() {
    setLoading(true);
    try {
      const [projRes, tasksRes, actRes] = await Promise.all([
        getProject(id),
        listProjectTasks(id).catch(() => ({ data: { items: [] } })),
        listProjectActivity(id, { limit: 25 }).catch(() => ({ data: { items: [] } })),
      ]);
      setProject(projRes.data.project);
      setTasks(tasksRes.data.items || []);
      setActivity(actRes.data.items || []);
    } catch (e) {
      showToast(getErrorMessage(e, "Unable to load this project."), "error");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  // Project update
  async function handleUpdate(values) {
    setPending(true);
    try {
      const r = await updateProject(id, values);
      setProject(r.data.project);
      setEditing(false);
      showToast("Project details updated.", "success");
    } catch (e) {
      showToast(getErrorMessage(e, "Unable to update project."), "error");
    } finally {
      setPending(false);
    }
  }

  // Delete project
  async function handleDelete() {
    setPending(true);
    try {
      await deleteProject(id);
      navigate("/projects", { replace: true });
    } catch (e) {
      showToast(getErrorMessage(e, "Unable to delete project."), "error");
      setPending(false);
      setConfirmDel(false);
    }
  }

  // Add member
  async function handleAddMember(e) {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setPending(true);
    try {
      const r = await addProjectMember(id, { email: memberEmail.trim(), role: memberRole });
      setProject(r.data.project);
      setMEmail("");
      setMRole("member");
      showToast("Team member added.", "success");
    } catch (e) {
      showToast(getErrorMessage(e, "Unable to add member."), "error");
    } finally {
      setPending(false);
    }
  }

  // Change member role
  async function handleRoleChange(userId, role) {
    setPending(true);
    try {
      const r = await updateProjectMember(id, userId, { role });
      setProject(r.data.project);
      showToast("Member role updated.", "success");
    } catch (e) {
      showToast(getErrorMessage(e, "Unable to update role."), "error");
    } finally {
      setPending(false);
    }
  }

  // Remove member
  async function handleRemoveMember(userId) {
    setPending(true);
    try {
      const r = await removeProjectMember(id, userId);
      setProject(r.data.project);
      showToast("Member removed.", "success");
    } catch (e) {
      showToast(getErrorMessage(e, "Unable to remove member."), "error");
    } finally {
      setPending(false);
    }
  }

  // Task creation & editing
  async function handleTaskSubmit(payload) {
    setPending(true);
    setTaskModalError("");
    try {
      if (editTaskTarget) {
        await updateProjectTask(id, editTaskTarget.id, payload);
        showToast("Task updated successfully.", "success");
      } else {
        await createProjectTask(id, { ...payload, projectId: id });
        showToast("Task created successfully.", "success");
      }
      setTaskModalOpen(false);
      setEditTaskTarget(null);
      const res = await listProjectTasks(id);
      setTasks(res.data.items || []);
    } catch (e) {
      const msg = getErrorMessage(e, "Failed to save task.");
      setTaskModalError(msg);
      throw e;
    } finally {
      setPending(false);
    }
  }

  // Quick task status change
  async function handleTaskStatusChange(task, newStatus) {
    setPending(true);
    try {
      await updateProjectTask(id, task.id, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (e) {
      showToast(getErrorMessage(e, "Could not update task status."), "error");
    } finally {
      setPending(false);
    }
  }

  // Delete task
  async function handleDeleteTask() {
    if (!deleteTaskTarget) return;
    setPending(true);
    try {
      await deleteProjectTask(id, deleteTaskTarget.id);
      setTasks(prev => prev.filter(t => t.id !== deleteTaskTarget.id));
      showToast("Task deleted.", "success");
      setDeleteTaskTarget(null);
    } catch (e) {
      showToast(getErrorMessage(e, "Could not delete task."), "error");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <section className="fade-in">
        <div className="skeleton" style={{ height: "1.5rem", width: "14rem", marginBottom: "1rem", borderRadius: 8 }} />
        <div className="skeleton" style={{ height: "2.5rem", width: "22rem", marginBottom: "1.5rem", borderRadius: 8 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: "6.5rem", borderRadius: 12 }} />)}
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="fade-in">
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            marginBottom: "1.25rem",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Project not found or you don't have access to view it.</span>
        </div>
        <Link to="/projects" className="btn btn-secondary">Back to projects</Link>
      </section>
    );
  }

  const canManage = canManageProject(project.myRole);
  const canDelete = project.myRole === "owner" || canManage;

  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "done").length;
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchStatus = !taskFilter || t.status === taskFilter || (taskFilter === "completed" && t.status === "done");
    const matchSearch = !taskSearch ||
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.taskCode && t.taskCode.toLowerCase().includes(taskSearch.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const projectMembersList = (project.members || []).map(m => m.user).filter(Boolean);

  return (
    <section className="fade-in">

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ margin: "0 0 1rem", fontSize: "0.8125rem", color: "var(--muted)" }}>
        <Link to="/projects" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Projects</Link>
        <span style={{ margin: "0 0.45rem", opacity: 0.6 }}>/</span>
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{project.name}</span>
      </nav>

      {/* Header with Project Title & Action Buttons */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div style={{ flex: "1 1 20rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
            <span style={{ fontWeight: 800, fontSize: "0.8rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: "6px" }}>
              {project.key || "PRJ"}
            </span>
            <h1 className="page-title" style={{ margin: 0 }}>{project.name}</h1>
            <span className={"badge " + projectStatusBadge(project.status)}>
              {statusLabel(project.status)}
            </span>
          </div>
          {project.description && (
            <p style={{ margin: "0.4rem 0 0", color: "var(--muted)", fontSize: "0.875rem", maxWidth: "55rem", lineHeight: 1.5 }}>
              {project.description}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ gap: "0.4rem" }}
            onClick={() => { setEditTaskTarget(null); setTaskModalOpen(true); }}
          >
            + Add task
          </button>

          {canManage && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing(v => !v)}
            >
              {editing ? "Close editor" : "Edit project"}
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmDel(true)}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Project Completion Progress Bar */}
      <div className="card" style={{ padding: "1.125rem 1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--ink)" }}>
            Sprint Completion Progress
          </span>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: progressPercent === 100 ? "#10b981" : "var(--accent)" }}>
            {progressPercent}% ({completedTasks} of {totalTasks} tasks completed)
          </span>
        </div>
        <div style={{ height: "8px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: progressPercent === 100 ? "#10b981" : "var(--accent)",
              borderRadius: "99px",
              transition: "width 240ms ease",
            }}
          />
        </div>
      </div>

      {/* 4 Primary Project KPI Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 11rem), 1fr))", gap: "0.875rem", marginBottom: "1.75rem" }}>
        <InfoTile
          label="Status"
          value={statusLabel(project.status)}
          sub={project.category || "Workspace"}
          accent={project.status === "completed" ? "#10b981" : undefined}
        />
        <InfoTile
          label="Total Tasks"
          value={totalTasks}
          sub={`${inProgressTasks} in progress`}
          accent="var(--accent)"
        />
        <InfoTile
          label="Team Members"
          value={project.members.length}
          sub={`Your role: ${ROLE_LABEL[project.myRole] || "Member"}`}
        />
        <InfoTile
          label="Target Due Date"
          value={formatDate(project.dueDate)}
          sub={project.dueDate ? "Project deadline" : "No deadline"}
        />
      </div>

      {/* Edit Form Drawer */}
      {editing && (
        <div className="card" style={{ marginBottom: "1.75rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>Edit Project Details</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>✕</button>
          </div>
          <ProjectForm
            initial={project}
            submitLabel="Save changes"
            pending={pending}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setTab("tasks")}
          style={{
            padding: "0.65rem 1.125rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: tab === "tasks" ? 700 : 500,
            color: tab === "tasks" ? "var(--ink)" : "var(--muted)",
            borderBottom: tab === "tasks" ? "2.5px solid var(--accent)" : "2.5px solid transparent",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            transition: "all 120ms ease",
          }}
        >
          Tasks
          <span style={{ fontSize: "0.75rem", padding: "1px 7px", borderRadius: "99px", background: tab === "tasks" ? "var(--accent-soft)" : "var(--surface2)", color: tab === "tasks" ? "var(--accent)" : "var(--muted)", fontWeight: 700 }}>
            {totalTasks}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("members")}
          style={{
            padding: "0.65rem 1.125rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: tab === "members" ? 700 : 500,
            color: tab === "members" ? "var(--ink)" : "var(--muted)",
            borderBottom: tab === "members" ? "2.5px solid var(--accent)" : "2.5px solid transparent",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            transition: "all 120ms ease",
          }}
        >
          Members
          <span style={{ fontSize: "0.75rem", padding: "1px 7px", borderRadius: "99px", background: tab === "members" ? "var(--accent-soft)" : "var(--surface2)", color: tab === "members" ? "var(--accent)" : "var(--muted)", fontWeight: 700 }}>
            {project.members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("activity")}
          style={{
            padding: "0.65rem 1.125rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: tab === "activity" ? 700 : 500,
            color: tab === "activity" ? "var(--ink)" : "var(--muted)",
            borderBottom: tab === "activity" ? "2.5px solid var(--accent)" : "2.5px solid transparent",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            transition: "all 120ms ease",
          }}
        >
          Activity
          <span style={{ fontSize: "0.75rem", padding: "1px 7px", borderRadius: "99px", background: tab === "activity" ? "var(--accent-soft)" : "var(--surface2)", color: tab === "activity" ? "var(--accent)" : "var(--muted)", fontWeight: 700 }}>
            {activity.length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: TASKS ── */}
      {tab === "tasks" && (
        <div className="fade-in">
          {/* Task Filters & View Toggle */}
          <div className="card" style={{ padding: "0.875rem 1rem", display: "flex", gap: "0.875rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flex: "1 1 18rem" }}>
              <input
                className="input"
                style={{ maxWidth: "16rem", flex: "1 1 12rem" }}
                placeholder="Search tasks by title or code…"
                value={taskSearch}
                onChange={e => setTaskSearch(e.target.value)}
              />

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <label className="label" htmlFor="p-filter-status" style={{ margin: 0 }}>Status:</label>
                <select
                  id="p-filter-status"
                  className="input"
                  style={{ width: "auto" }}
                  value={taskFilter}
                  onChange={e => setTaskFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {COLUMNS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Board / Table Switcher */}
            <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                style={{
                  padding: "0.35rem 0.75rem",
                  background: viewMode === "board" ? "var(--accent)" : "var(--surface)",
                  color: viewMode === "board" ? "#fff" : "var(--muted)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                style={{
                  padding: "0.35rem 0.75rem",
                  background: viewMode === "table" ? "var(--accent)" : "var(--surface)",
                  color: viewMode === "table" ? "#fff" : "var(--muted)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                Table
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: "0 0 0.5rem", color: "var(--ink)" }}>
                {taskSearch || taskFilter ? "No tasks match your filters" : "No tasks in this project yet"}
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 1.25rem" }}>
                {taskSearch || taskFilter ? "Try clearing search or changing the status filter." : "Create sprint tasks to start collaborating with your team."}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { setEditTaskTarget(null); setTaskModalOpen(true); }}
              >
                + Create task
              </button>
            </div>
          ) : viewMode === "board" ? (
            /* Board View */
            <div className="kanban-board-scroll">
              {COLUMNS.map(col => {
                const colTasks = filteredTasks.filter(t => t.status === col.value || (col.value === "completed" && t.status === "done"));
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
                        colTasks.map(task => (
                          <div key={task.id} className="kanban-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                              <span style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--accent)" }}>
                                {task.taskCode || "TASK"}
                              </span>
                              {task.dueDate && (
                                <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>

                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", lineHeight: 1.35, color: "var(--ink)" }}>
                              {task.title}
                            </p>

                            {task.description && (
                              <p style={{ margin: "0.35rem 0 0.5rem", fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                {task.description}
                              </p>
                            )}

                            <div style={{ marginTop: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <select
                                className="input"
                                style={{ flex: 1, height: "1.875rem", fontSize: "0.75rem", padding: "0 0.5rem" }}
                                value={task.status}
                                onChange={e => handleTaskStatusChange(task, e.target.value)}
                              >
                                {COLUMNS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                              </select>
                            </div>

                            <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--ink2)", fontWeight: 500 }}>
                                {task.assignee?.name ? `👤 ${task.assignee.name.split(" ")[0]}` : "Unassigned"}
                              </span>
                              <div style={{ display: "flex", gap: "0.3rem" }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ height: "1.75rem", padding: "0 0.55rem", fontSize: "0.75rem" }}
                                  onClick={() => { setEditTaskTarget(task); setTaskModalOpen(true); }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  style={{ height: "1.75rem", padding: "0 0.4rem", color: "var(--red)" }}
                                  onClick={() => setDeleteTaskTarget(task)}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <>
              {/* Desktop Table View */}
              <div className="card tasks-desktop-table" style={{ padding: 0, overflow: "hidden" }}>
                <div className="table-wrap">
                  <table className="table" style={{ width: "100%", minWidth: "820px" }}>
                    <thead>
                      <tr>
                        <th className="nowrap" style={{ width: "6.5rem" }}>Code</th>
                        <th style={{ minWidth: "14rem" }}>Task Title</th>
                        <th className="nowrap" style={{ width: "8rem" }}>Status</th>
                        <th className="nowrap" style={{ width: "9.5rem" }}>Assignee</th>
                        <th className="nowrap" style={{ width: "8.5rem" }}>Due Date</th>
                        <th className="nowrap" style={{ width: "6rem", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(t => (
                        <tr key={t.id}>
                          <td className="nowrap" style={{ fontWeight: 700, color: "var(--accent)" }}>{t.taskCode || "TASK"}</td>
                          <td style={{ fontWeight: 600, color: "var(--ink)" }}>{t.title}</td>
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
                              onClick={() => { setEditTaskTarget(t); setTaskModalOpen(true); }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Task Card List */}
              <div className="tasks-mobile-list">
                {filteredTasks.map(t => (
                  <div key={t.id} className="card" style={{ padding: "1.125rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: "6px" }}>
                        {t.taskCode || "TASK"}
                      </span>
                      <span className={"badge " + (t.status === "completed" || t.status === "done" ? "badge-green" : t.status === "in_progress" ? "badge-blue" : "badge-gray")}>
                        {t.status}
                      </span>
                    </div>

                    <h3 style={{ margin: "0.15rem 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.35 }}>
                      {t.title}
                    </h3>

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
                          onClick={() => { setEditTaskTarget(t); setTaskModalOpen(true); }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 2: MEMBERS ── */}
      {tab === "members" && (
        <div className="fade-in">
          {/* Members Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "1.5rem" }}>
            <div className="table-wrap">
              <table className="table" style={{ width: "100%", minWidth: "620px" }}>
                <thead>
                  <tr>
                    <th>Member Details</th>
                    <th>Email Address</th>
                    <th>Project Role</th>
                    {canManage && <th style={{ textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {project.members.map(m => (
                    <tr key={m.user.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <Avatar name={m.user.name} size={32} />
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--ink)" }}>{m.user.name}</p>
                            <span style={{ fontSize: "0.725rem", color: "var(--muted)" }}>
                              Joined {m.joinedAt ? formatDate(m.joinedAt) : "Recently"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--ink2)" }}>{m.user.email}</td>
                      <td>
                        {canManage ? (
                          <select
                            className="input"
                            style={{ width: "9rem", height: "2rem", fontSize: "0.8125rem", padding: "0 0.6rem" }}
                            value={m.role}
                            disabled={pending}
                            onChange={e => handleRoleChange(m.user.id, e.target.value)}
                            aria-label={"Role for " + m.user.name}
                          >
                            {project.myRole === "owner" && <option value="owner">Project Lead</option>}
                            <option value="admin">Manager</option>
                            <option value="member">Member</option>
                          </select>
                        ) : (
                          <span className={"badge " + (ROLE_BADGE[m.role] || "badge-gray")}>
                            {ROLE_LABEL[m.role] || m.role}
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td style={{ textAlign: "right" }}>
                          {m.user.id !== project.owner?.id ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: "var(--red)" }}
                              disabled={pending}
                              onClick={() => handleRemoveMember(m.user.id)}
                            >
                              Remove
                            </button>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Owner</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add member form */}
          {canManage && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <h3 style={{ margin: "0 0 0.875rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)" }}>
                Add Team Member to Project
              </h3>
              <form onSubmit={handleAddMember} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.75rem", alignItems: "flex-end" }}>
                <div>
                  <label className="label" htmlFor="member-email" style={{ marginBottom: "0.35rem" }}>Member Email</label>
                  <input
                    id="member-email"
                    className="input"
                    type="email"
                    value={memberEmail}
                    onChange={e => setMEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="member-role" style={{ marginBottom: "0.35rem" }}>Project Role</label>
                  <select
                    id="member-role"
                    className="input"
                    style={{ width: "8.5rem" }}
                    value={memberRole}
                    onChange={e => setMRole(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Manager</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  + Add member
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: ACTIVITY ── */}
      {tab === "activity" && (
        <div className="fade-in">
          {activity.length === 0 ? (
            <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--muted)", fontSize: "0.875rem" }}>
              No recorded activity for this project yet.
            </div>
          ) : (
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {activity.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.6rem 0",
                      borderBottom: i < activity.length - 1 ? "1px solid var(--border)" : "none",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
                      <Avatar name={item.actor?.name || "System"} size={26} />
                      <p style={{ margin: 0, color: "var(--ink2)", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <strong style={{ color: "var(--ink)" }}>{item.actor?.name || "System"}</strong>{" "}
                        {item.summary || item.description}
                      </p>
                    </div>
                    <time style={{ color: "var(--muted)", whiteSpace: "nowrap", fontSize: "0.75rem", flexShrink: 0 }}>
                      {item.createdAt ? formatDate(item.createdAt) : "Recently"}
                    </time>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Modal for Creating / Editing Project Tasks */}
      <TaskModal
        open={taskModalOpen}
        initial={editTaskTarget}
        projects={[project]}
        members={projectMembersList}
        pending={pending}
        error={taskModalError}
        onClose={() => { setTaskModalOpen(false); setTaskModalError(""); }}
        onSubmit={handleTaskSubmit}
      />

      {/* Confirm Delete Task */}
      {Boolean(deleteTaskTarget) && (
        <ConfirmDialog
          open={Boolean(deleteTaskTarget)}
          title="Delete task?"
          message={`Are you sure you want to permanently delete "${deleteTaskTarget?.title}"?`}
          confirmLabel="Delete task"
          danger
          pending={pending}
          onConfirm={handleDeleteTask}
          onCancel={() => setDeleteTaskTarget(null)}
        />
      )}

      {/* Confirm Delete Project */}
      {confirmDel && (
        <ConfirmDialog
          open={confirmDel}
          title="Delete this project?"
          message={`Permanently removes "${project.name}" and all associated sprint tasks, backlog items, and comments. This action cannot be undone.`}
          confirmLabel="Delete project"
          danger
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </section>
  );
}
