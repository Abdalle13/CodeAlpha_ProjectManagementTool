import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProjectForm from "../components/ProjectForm.jsx";
import { createProject, getErrorMessage, listProjects, updateProject } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_LABEL = { planning: "Planning", active: "Active", on_hold: "On Hold", completed: "Completed", cancelled: "Cancelled" };
const STATUS_BADGE = { planning: "badge-gray", active: "badge-blue", on_hold: "badge-yellow", completed: "badge-green", cancelled: "badge-red" };

function ProjectCard({ project }) {
  return (
    <Link to={"/projects/" + project.id} style={{ textDecoration: "none", display: "block" }}>
      <div className="card" style={{ padding: "1.25rem", transition: "box-shadow 120ms, border-color 120ms", cursor: "pointer" }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow)"; e.currentTarget.style.borderColor = "var(--border2)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.625rem" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9375rem", color: "var(--ink)", lineHeight: 1.3 }}>{project.name}</p>
          <span className={"badge " + (STATUS_BADGE[project.status] || "badge-gray")} style={{ flexShrink: 0 }}>{STATUS_LABEL[project.status] || project.status}</span>
        </div>
        {project.description && <p style={{ margin: "0 0 0.75rem", fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{project.description}</p>}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.775rem", color: "var(--muted)" }}>
          <span>{project.members.length} member{project.members.length !== 1 ? "s" : ""}</span>
          {project.dueDate && <span>Due {formatDate(project.dueDate)}</span>}
          <span style={{ marginLeft: "auto", textTransform: "capitalize", fontWeight: 500, color: "var(--accent-text)" }}>{project.myRole}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const [items, setItems]           = useState([]);
  const [pagination, setPagination] = useState(null);
  const [query, setQuery]           = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [notice, setNotice]         = useState("");
  const [creating, setCreating]     = useState(false);
  const [pending, setPending]       = useState(false);

  async function load(q = query, st = statusFilter) {
    setLoading(true); setError("");
    try {
      const r = await listProjects({ q: q || undefined, status: st || undefined });
      setItems(r.data.items); setPagination(r.data.pagination);
    } catch (e) { setError(getErrorMessage(e, "Unable to load projects.")); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(values) {
    setPending(true); setError("");
    try {
      await createProject(values);
      setCreating(false); setNotice("Project created.");
      await load();
    } catch (e) { setError(getErrorMessage(e, "Unable to create project.")); }
    finally { setPending(false); }
  }

  function handleStatusChange(e) { setStatusFilter(e.target.value); load(query, e.target.value); }
  function handleSearch(e) { e.preventDefault(); load(query, statusFilter); }

  return (
    <section className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>Manage and browse your workspaces.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>New project</button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginTop: "1.25rem", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: "10rem" }}>
          <label className="label" htmlFor="proj-search">Search</label>
          <input id="proj-search" className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects…" />
        </div>
        <div style={{ width: "11rem" }}>
          <label className="label" htmlFor="proj-status">Status</label>
          <select id="proj-status" className="input" value={statusFilter} onChange={handleStatusChange}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>

      {notice && <p role="status" style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--green)" }}>{notice}</p>}
      {error  && <p role="alert"  style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--red)" }}>{error}</p>}

      {pagination && <p style={{ marginTop: "0.625rem", fontSize: "0.775rem", color: "var(--muted)" }}>{pagination.total} project{pagination.total !== 1 ? "s" : ""}</p>}

      {loading ? (
        <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))", marginTop: "1.25rem" }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "7rem", borderRadius: 12 }} />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ marginTop: "2rem", padding: "2.5rem", textAlign: "center", borderRadius: 14, border: "2px dashed var(--border)", background: "var(--surface)" }}>
          <p style={{ fontWeight: 600, margin: "0 0 0.5rem" }}>No projects found</p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>Create a project to organize your team's work.</p>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>Create project</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))", marginTop: "1.25rem" }}>
          {items.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {creating && (
        <div className="overlay" role="presentation" onClick={() => !pending && setCreating(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-proj-title" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 id="new-proj-title" style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>New project</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreating(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <ProjectForm submitLabel="Create project" pending={pending} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
          </div>
        </div>
      )}
    </section>
  );
}
