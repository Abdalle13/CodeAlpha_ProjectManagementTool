import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAdminProject, getErrorMessage, listAdminProjects } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Toast from "../components/Toast.jsx";

const STATUS_BADGE = {
  active: "badge-blue",
  planning: "badge-purple",
  paused: "badge-yellow",
  completed: "badge-green",
  archived: "badge-gray",
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const load = useCallback(async (page = 1, q = query, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await listAdminProjects({ limit: 15, page, q: q || undefined, status: status || undefined });
      setProjects(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) {
      showToast(getErrorMessage(e, "Unable to load platform projects."), "error");
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => { load(1); }, []);

  async function handleDeleteProject(project) {
    setPendingId(project.id);
    setConfirm(null);
    try {
      await deleteAdminProject(project.id);
      setProjects(prev => prev.filter(p => p.id !== project.id));
      showToast(`Project "${project.name}" and its tasks were permanently removed.`);
    } catch (e) {
      showToast(getErrorMessage(e, "Unable to delete project."), "error");
    } finally {
      setPendingId("");
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    load(1, query, statusFilter);
  }

  const STATUS_LABELS = ["", "active", "planning", "paused", "completed", "archived"];

  return (
    <section className="fade-in">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title" style={{ margin: 0 }}>Projects</h1>
        <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
          Overview and governance of all organization projects and workspaces.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: "1rem", marginBottom: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", justifyContent: "space-between" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: "1 1 18rem" }}>
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects by name or key…"
            aria-label="Search projects"
          />
          <button type="submit" className="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search
          </button>
        </form>

        <select
          className="input"
          style={{ width: "auto" }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); load(1, query, e.target.value); }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="planning">Planning</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Projects Table */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
        {loading ? (
          <div style={{ padding: "1.5rem", display: "grid", gap: "0.75rem" }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: "2.75rem", borderRadius: 8 }} />)}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Key</th>
                  <th>Owner</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: "2.5rem" }}>
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  projects.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)", maxWidth: "20rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 6px", background: "var(--surface2)", borderRadius: "4px", color: "var(--ink2)", fontFamily: "monospace" }}>
                          {p.key}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.875rem", color: "var(--ink2)" }}>{p.owner?.name || "Unassigned"}</td>
                      <td>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                          {p.members?.length || 0} member{p.members?.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td>
                        <span className={"badge " + (STATUS_BADGE[p.status] || "badge-gray")} style={{ textTransform: "capitalize" }}>
                          {p.status?.replace("_", " ") || "Active"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                        {formatDate(p.updatedAt || p.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <Link
                            to={"/projects/" + p.id}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem" }}
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={pendingId === p.id}
                            onClick={() => setConfirm({ project: p })}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            Page {pagination.page} of {pagination.pages} ({pagination.total} total projects)
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="btn btn-secondary btn-sm" disabled={pagination.page <= 1 || loading} onClick={() => load(pagination.page - 1, query, statusFilter)}>
              Previous
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={pagination.page >= pagination.pages || loading} onClick={() => load(pagination.page + 1, query, statusFilter)}>
              Next
            </button>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={`Delete project: ${confirm.project.name}`}
          message="All associated tasks, checklists, comments, and activities will be permanently deleted. This action is irreversible."
          confirmLabel="Permanently Delete"
          danger
          onConfirm={() => handleDeleteProject(confirm.project)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}
