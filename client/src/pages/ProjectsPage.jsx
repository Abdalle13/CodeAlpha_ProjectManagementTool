import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProjectForm from "../components/ProjectForm.jsx";
import { createProject, getErrorMessage, listProjects } from "../lib/api.js";
import { PROJECT_STATUSES, formatDate, statusLabel } from "../lib/projects.js";

export default function ProjectsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);

  async function load(nextQuery = query, nextStatus = status) {
    setLoading(true);
    setError("");
    try {
      const payload = await listProjects({
        q: nextQuery || undefined,
        status: nextStatus || undefined,
      });
      setItems(payload.data.items);
      setPagination(payload.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load projects."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Load once on mount; search/filter trigger load explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    await load(query, status);
  }

  async function handleCreate(values) {
    setPending(true);
    setError("");
    try {
      await createProject(values);
      setCreating(false);
      setNotice("Project created.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create this project."));
    } finally {
      setPending(false);
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Create and browse the workspaces you belong to. Open a project to edit details or manage members.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          New project
        </button>
      </div>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
        <div className="flex-1">
          <label className="label" htmlFor="project-search">
            Search
          </label>
          <input
            id="project-search"
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name"
          />
        </div>
        <div className="sm:w-48">
          <label className="label" htmlFor="project-filter">
            Status
          </label>
          <select
            id="project-filter"
            className="input"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn btn-secondary w-full sm:w-auto">
            Filter
          </button>
        </div>
      </form>

      {notice ? (
        <p className="mt-4 text-sm text-[var(--accent)]" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {creating ? (
        <div className="dialog-overlay" role="presentation" onClick={() => !pending && setCreating(false)}>
          <div
            className="dialog-panel surface-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="create-project-title" className="font-display text-xl font-semibold">
              New project
            </h2>
            <div className="mt-5">
              <ProjectForm
                submitLabel="Create project"
                pending={pending}
                onSubmit={handleCreate}
                onCancel={() => setCreating(false)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-8 text-[var(--muted)]" role="status">
          Loading projects…
        </p>
      ) : items.length === 0 ? (
        <div className="surface-card mt-6 p-8">
          <p className="font-display text-xl font-semibold">No projects yet</p>
          <p className="mt-2 text-[var(--muted)]">Create a project to start organizing work with your team.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {items.map((project) => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                className="surface-card block p-5 transition-colors hover:bg-[var(--surface-muted)]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-display text-xl font-semibold">{project.name}</p>
                    <p className="mt-1 text-[var(--muted)]">
                      {project.description || "No description yet."}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-[var(--accent)]">{statusLabel(project.status)}</p>
                </div>
                <p className="mt-4 text-sm text-[var(--muted)]">
                  {project.members.length} member{project.members.length === 1 ? "" : "s"} · Due{" "}
                  {formatDate(project.dueDate)} · Your role: {project.myRole}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pagination ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          Showing {items.length} of {pagination.total} projects
        </p>
      ) : null}
    </section>
  );
}
