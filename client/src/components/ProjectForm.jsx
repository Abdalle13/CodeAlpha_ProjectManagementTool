import { useState } from "react";
const STATUSES = [
  { value: "planning",    label: "Planning" },
  { value: "active",      label: "Active" },
  { value: "on_hold",     label: "On Hold" },
  { value: "completed",   label: "Completed" },
  { value: "cancelled",   label: "Cancelled" },
];
export default function ProjectForm({ initial = {}, submitLabel = "Save", pending, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: initial.name || "", description: initial.description || "", status: initial.status || "planning", dueDate: initial.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : "" });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  function handleSubmit(e) { e.preventDefault(); onSubmit(form); }
  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
      <div>
        <label className="label" htmlFor="pf-name">Project name *</label>
        <input id="pf-name" className="input" value={form.name} onChange={set("name")} placeholder="e.g. Website Redesign" minLength={2} maxLength={100} required />
      </div>
      <div>
        <label className="label" htmlFor="pf-desc">Description</label>
        <textarea id="pf-desc" className="input" value={form.description} onChange={set("description")} placeholder="What is this project about?" maxLength={2000} style={{ minHeight: "4.5rem" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label className="label" htmlFor="pf-status">Status</label>
          <select id="pf-status" className="input" value={form.status} onChange={set("status")}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pf-due">Due date</label>
          <input id="pf-due" className="input" type="date" value={form.dueDate} onChange={set("dueDate")} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
      </div>
    </form>
  );
}
