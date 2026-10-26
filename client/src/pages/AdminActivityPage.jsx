import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage, listAdminActivity } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";

function IconAlert() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }

export default function AdminActivityPage() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await listAdminActivity({ limit: 25, page });
      setActivities(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) {
      setError(getErrorMessage(e, "Unable to load system activity log."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <section className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link to="/admin" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.8125rem" }}>
              Admin Console
            </Link>
            <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>/</span>
            <span style={{ fontSize: "0.8125rem", color: "var(--ink)", fontWeight: 600 }}>System Audit Trail</span>
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>System Audit & Platform Activity</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            Immutable chronological record of events, security updates, project creations, and member actions.
          </p>
        </div>

        <Link to="/admin" className="btn btn-secondary btn-sm">
          &larr; Back to Dashboard
        </Link>
      </div>

      {error && (
        <p role="alert" style={{ marginBottom: "1rem", fontSize: "0.8125rem", color: "var(--red)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <IconAlert /> {error}
        </p>
      )}

      {/* Activity Log Container */}
      <div className="card" style={{ padding: "1.5rem" }}>
        {loading ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: "3rem", borderRadius: 8 }} />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "2.5rem 0" }}>
            No platform activity recorded yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {activities.map((act) => {
              const actorName = act.actor?.name || act.user?.name || "System Automated";
              const projectName = act.project?.name || "Global Workspace";
              const taskTitle = act.task?.title;

              return (
                <div
                  key={act._id || act.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.875rem 1rem",
                    background: "var(--surface2)",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                      <span className="badge badge-purple" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>
                        {act.action || "Event"}
                      </span>
                      <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.875rem" }}>
                        {act.summary || act.description || act.action}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.775rem", color: "var(--muted)" }}>
                      Actor: <strong style={{ color: "var(--ink)" }}>{actorName}</strong> • Context: {projectName}
                      {taskTitle && ` (${taskTitle})`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500 }}>
                      {formatDate(act.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
              Page {pagination.page} of {pagination.pages} ({pagination.total} events)
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => load(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => load(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
