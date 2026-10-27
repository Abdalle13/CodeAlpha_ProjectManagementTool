import { useState, useEffect } from "react";

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function TaskModal({ open, onClose, onSubmit, projects = [], members = [], pending, initial = null, error: parentError = "" }) {
  const [projectId, setProjectId]     = useState("");
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus]           = useState("todo");
  const [assigneeId, setAssigneeId]   = useState("");
  const [dueDate, setDueDate]         = useState("");
  const [error, setError]             = useState("");

  useEffect(() => {
    if (initial) {
      setProjectId(initial.project?.id || initial.project || "");
      setTitle(initial.title || "");
      setDescription(initial.description || "");
      setStatus(initial.status || "todo");
      setAssigneeId(initial.assignee?.id || initial.assignee || "");
      setDueDate(initial.dueDate ? initial.dueDate.slice(0, 10) : "");
    } else {
      setProjectId(projects[0]?.id || "");
      setTitle("");
      setDescription("");
      setStatus("todo");
      setAssigneeId("");
      setDueDate("");
    }
  }, [initial, open, projects]);

  useEffect(() => {
    if (parentError) {
      setError(parentError);
    }
  }, [parentError]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }
    setError("");
    try {
      await onSubmit({
        projectId,
        title: title.trim(),
        description: description.trim(),
        status,
        priority: initial?.priority || "medium",
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        estimatedHours: initial?.estimatedHours || 0,
      });
    } catch (err) {
      setError(err?.message || "Failed to save task.");
    }
  }

  function handleFieldChange(setter, val) {
    setter(val);
    setError("");
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="card-raised"
        style={{
          width: "100%",
          maxWidth: "34rem",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.75rem",
          borderRadius: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)" }}>
              {initial ? "Edit Task" : "Create New Task"}
            </h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Assign tasks to team members and track sprint progress.
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close dialog">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.1rem" }}>
          {/* Project selector */}
          {projects.length > 0 && (
            <div>
              <label className="label" htmlFor="t-proj">Project</label>
              <select
                id="t-proj"
                className="input"
                value={projectId}
                onChange={e => handleFieldChange(setProjectId, e.target.value)}
                required
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="label" htmlFor="t-title">Task title</label>
            <input
              id="t-title"
              className="input input-lg"
              placeholder="e.g. Implement user authentication"
              value={title}
              onChange={e => handleFieldChange(setTitle, e.target.value)}
              required
              minLength={2}
              maxLength={160}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label" htmlFor="t-desc">Description</label>
            <textarea
              id="t-desc"
              className="input"
              rows={3}
              placeholder="Provide requirements and acceptance criteria…"
              value={description}
              onChange={e => handleFieldChange(setDescription, e.target.value)}
              maxLength={2000}
            />
          </div>

          {/* Status & Assignee */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label" htmlFor="t-status">Status</label>
              <select id="t-status" className="input" value={status} onChange={e => handleFieldChange(setStatus, e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="t-ass">Assignee</label>
              <select id="t-ass" className="input" value={assigneeId} onChange={e => handleFieldChange(setAssigneeId, e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="label" htmlFor="t-due">Due date</label>
            <input id="t-due" className="input" type="date" value={dueDate} onChange={e => handleFieldChange(setDueDate, e.target.value)} />
          </div>

          {/* Prominent Error Message inside the Modal Card */}
          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "1px solid rgba(239, 68, 68, 0.3)",
                lineHeight: 1.4,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={pending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Saving…" : initial ? "Save changes" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
