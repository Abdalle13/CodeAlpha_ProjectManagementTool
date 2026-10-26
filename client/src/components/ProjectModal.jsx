import { useState, useEffect } from "react";

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function ProjectModal({ open, onClose, onSubmit, pending, initial = null, error: parentError = "" }) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus]           = useState("active");
  const [startDate, setStartDate]     = useState("");
  const [dueDate, setDueDate]         = useState("");
  const [error, setError]             = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name || "");
      setDescription(initial.description || "");
      setStatus(initial.status || "active");
      setStartDate(initial.startDate ? initial.startDate.slice(0, 10) : "");
      setDueDate(initial.dueDate ? initial.dueDate.slice(0, 10) : "");
    } else {
      setName("");
      setDescription("");
      setStatus("active");
      setStartDate("");
      setDueDate("");
    }
    setError(parentError || "");
  }, [initial, open, parentError]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }

    if (startDate && dueDate && dueDate < startDate) {
      setError("Target deadline cannot be earlier than the start date.");
      return;
    }

    // Auto-generate key cleanly behind the scenes so the user never has to worry about it
    let autoKey = "";
    if (initial?.key) {
      autoKey = initial.key;
    } else {
      const cleaned = name.trim().replace(/[^A-Za-z0-9]/g, "");
      autoKey = (cleaned.slice(0, 4) || "PRJ").toUpperCase();
      if (autoKey.length < 2) autoKey = "PRJ";
    }

    onSubmit({
      name: name.trim(),
      key: autoKey,
      description: description.trim(),
      category: initial?.category || "Engineering",
      status,
      priority: initial?.priority || "medium",
      startDate: startDate || null,
      dueDate: dueDate || null,
      budget: initial?.budget || 0,
    });
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
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="card-raised"
        style={{
          width: "100%",
          maxWidth: "32rem",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.75rem",
          borderRadius: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)" }}>
              {initial ? "Edit Project" : "Create New Project"}
            </h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Set up your workspace initiative and timeline.
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close dialog">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.1rem" }}>
          {/* Project Name */}
          <div>
            <label className="label" htmlFor="p-name">Project name</label>
            <input
              id="p-name"
              className="input input-lg"
              placeholder="e.g. Mobile App Redesign"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
              <label className="label" htmlFor="p-desc" style={{ margin: 0 }}>Description</label>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{description.length}/500</span>
            </div>
            <textarea
              id="p-desc"
              className="input"
              rows={3}
              placeholder="What is the goal of this initiative?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Status */}
          <div>
            <label className="label" htmlFor="p-stat">Status</label>
            <select id="p-stat" className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Schedule */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label" htmlFor="p-start">Start date</label>
              <input
                id="p-start"
                className="input"
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (dueDate && e.target.value && dueDate < e.target.value) {
                    setDueDate(e.target.value);
                  }
                  setError("");
                }}
              />
            </div>
            <div>
              <label className="label" htmlFor="p-due">Target deadline</label>
              <input
                id="p-due"
                className="input"
                type="date"
                min={startDate || undefined}
                value={dueDate}
                onChange={e => { setDueDate(e.target.value); setError(""); }}
              />
            </div>
          </div>

          {/* Error Message inside the Modal Card */}
          {error && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "var(--red-soft)",
                color: "var(--red)",
                fontSize: "0.8125rem",
                border: "1px solid var(--red)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={pending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Saving…" : initial ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
