import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createProject, deleteProject, getErrorMessage, listProjects, updateProject } from "../lib/api.js";
import { formatDate, projectStatusBadge, projectStatusLabel } from "../lib/projects.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ProjectModal from "../components/ProjectModal.jsx";
import Toast from "../components/Toast.jsx";

export default function ProjectsPage() {
  const [projects, setProjects]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [pending, setPending]           = useState(false);
  const [toast, setToast]               = useState(null);
  const [modalError, setModalError]     = useState("");
  const [query, setQuery]               = useState("");
  const [status, setStatus]             = useState("");
  const [viewMode, setViewMode]         = useState("grid"); // 'grid' | 'table'
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  async function load(q = query, st = status) {
    setLoading(true);
    try {
      const res = await listProjects({
        q: q || undefined,
        status: st || undefined,
        limit: 50,
      });
      setProjects(res.data.items);
    } catch (e) {
      showToast(getErrorMessage(e, "Unable to load projects."), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleFilter(newQ, newSt) {
    setQuery(newQ);
    setStatus(newSt);
    load(newQ, newSt);
  }

  async function handleModalSubmit(payload) {
    setPending(true);
    setModalError("");
    try {
      if (editTarget) {
        await updateProject(editTarget.id, payload);
        showToast(`Project "${payload.name}" updated successfully.`, "success");
      } else {
        await createProject(payload);
        showToast(`Project "${payload.name}" created successfully.`, "success");
      }
      setModalOpen(false);
      setEditTarget(null);
      await load();
    } catch (e) {
      setModalError(getErrorMessage(e, "Failed to save project."));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    try {
      await deleteProject(deleteTarget.id);
      showToast(`Project "${deleteTarget.name}" deleted.`, "success");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      showToast(getErrorMessage(e, "Unable to delete project."), "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="fade-in" style={{ position: "relative" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            Create and organize workspace repositories, roadmaps, and sprint initiatives.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { setEditTarget(null); setModalError(""); setModalOpen(true); }}
        >
          + New project
        </button>
      </div>

      {/* Filter and View toolbar */}
      <div className="card" style={{ padding: "0.875rem 1.25rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.875rem", alignItems: "center" }}>
        <input
          id="proj-search"
          className="input"
          style={{ maxWidth: "20rem", flex: "1 1 12rem" }}
          value={query}
          onChange={e => handleFilter(e.target.value, status)}
          placeholder="Search projects…"
        />
        <select
          className="input"
          style={{ width: "auto" }}
          value={status}
          onChange={e => handleFilter(query, e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>

        {/* View toggle */}
        <div style={{ marginLeft: "auto", display: "flex", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            style={{
              padding: "0.4rem 0.85rem",
              background: viewMode === "grid" ? "var(--accent)" : "var(--surface)",
              color: viewMode === "grid" ? "#fff" : "var(--muted)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            style={{
              padding: "0.4rem 0.85rem",
              background: viewMode === "table" ? "var(--accent)" : "var(--surface)",
              color: viewMode === "table" ? "#fff" : "var(--muted)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            Table
          </button>
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))", gap: "1rem" }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "11rem", borderRadius: "12px" }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ padding: "3.5rem 1.5rem", textAlign: "center" }}>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", margin: "0 0 0.5rem" }}>No projects found</p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
            {query || status ? "No projects match your current filters." : "Create your first workspace project to start assigning tasks."}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => { setEditTarget(null); setModalError(""); setModalOpen(true); }}>
            + Create project
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 19rem), 1fr))", gap: "1.25rem" }}>
          {projects.map(proj => (
            <div key={proj.id} className="card card-hover" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.725rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "1px 7px", borderRadius: "5px" }}>
                        {proj.key || "PRJ"}
                      </span>
                      <span className={"badge " + projectStatusBadge(proj.status)}>{projectStatusLabel(proj.status)}</span>
                    </div>
                    <Link to={"/projects/" + proj.id} style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)", textDecoration: "none" }}>
                      {proj.name}
                    </Link>
                  </div>
                </div>

                {proj.description && (
                  <p style={{ margin: 0, fontSize: "0.825rem", color: "var(--muted)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {proj.description}
                  </p>
                )}
              </div>

              <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.775rem", color: "var(--muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    👥 {proj.memberCount || proj.members?.length || 1} members
                  </span>
                  <span>{proj.dueDate ? "Due " + formatDate(proj.dueDate) : "No due date"}</span>
                </div>

                <Link
                  to={"/projects/" + proj.id}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: "0.35rem", padding: "0.35rem 0.85rem", fontSize: "0.8rem", fontWeight: 600 }}
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Fully responsive, well-proportioned Table */
        <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: "12px" }}>
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="table" style={{ width: "100%", minWidth: "620px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.85rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                    Project Name
                  </th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                    Status
                  </th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                    Due Date
                  </th>
                  <th style={{ padding: "0.85rem 1.25rem", textAlign: "right", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <Link to={"/projects/" + p.id} style={{ fontWeight: 600, color: "var(--ink)", textDecoration: "none", fontSize: "0.925rem" }}>
                        {p.name}
                      </Link>
                      {p.description && (
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)", maxWidth: "25rem", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={"badge " + projectStatusBadge(p.status)}>{projectStatusLabel(p.status)}</span>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                      {p.dueDate ? formatDate(p.dueDate) : "—"}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      <Link to={"/projects/" + p.id} className="btn btn-secondary btn-sm" style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        open={modalOpen}
        initial={editTarget}
        pending={pending}
        error={modalError}
        onClose={() => { setModalOpen(false); setModalError(""); }}
        onSubmit={handleModalSubmit}
      />

      {/* Confirm Delete */}
      {Boolean(deleteTarget) && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete project?"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated tasks will be removed.`}
          confirmLabel="Delete project"
          danger
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
}
