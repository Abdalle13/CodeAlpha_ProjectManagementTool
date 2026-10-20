import { useState } from "react";
import { PROJECT_STATUSES, toDateInput } from "../lib/projects.js";

const empty = {
  name: "",
  description: "",
  status: "planned",
  startDate: "",
  dueDate: "",
};

export default function ProjectForm({ initialValue = empty, submitLabel, pending, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    ...empty,
    ...initialValue,
    startDate: toDateInput(initialValue.startDate),
    dueDate: toDateInput(initialValue.dueDate),
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div>
        <label className="label" htmlFor="project-name">
          Name
        </label>
        <input
          id="project-name"
          className="input"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="project-description">
          Description
        </label>
        <textarea
          id="project-description"
          className="input textarea"
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="project-status">
          Status
        </label>
        <select
          id="project-status"
          className="input"
          value={form.status}
          onChange={(event) => update("status", event.target.value)}
        >
          {PROJECT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="project-start">
            Start date
          </label>
          <input
            id="project-start"
            className="input"
            type="date"
            value={form.startDate}
            onChange={(event) => update("startDate", event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="project-due">
            Due date
          </label>
          <input
            id="project-due"
            className="input"
            type="date"
            value={form.dueDate}
            onChange={(event) => update("dueDate", event.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
