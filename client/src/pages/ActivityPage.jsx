import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { listFeedActivity, listProjects, listTeamMembers, getErrorMessage } from "../lib/api.js";
import { Avatar } from "../layouts/AppLayout.jsx";
import Toast from "../components/Toast.jsx";

const ACTION_CONFIG = {
  completed:      { label: "completed", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", icon: "✓" },
  done:           { label: "completed", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", icon: "✓" },
  created:        { label: "created",   color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)", icon: "✦" },
  updated:        { label: "updated",   color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)", icon: "↻" },
  status_changed: { label: "moved",     color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", icon: "⇄" },
  commented:      { label: "commented", color: "#f97316", bg: "rgba(249, 115, 22, 0.12)", icon: "✎" },
  comment:        { label: "commented", color: "#f97316", bg: "rgba(249, 115, 22, 0.12)", icon: "✎" },
  assigned:       { label: "assigned",  color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)", icon: "→" },
  deleted:        { label: "deleted",   color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)", icon: "✕" },
  default:        { label: "activity",  color: "#6b7280", bg: "rgba(107, 114, 128, 0.12)", icon: "•" },
};

function formatRealTimeAgo(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function ActionBadge({ action }) {
  const norm = String(action || "").toLowerCase();
  let key = "default";
  if (norm.includes("complete") || norm.includes("done")) key = "completed";
  else if (norm.includes("creat")) key = "created";
  else if (norm.includes("comment")) key = "commented";
  else if (norm.includes("assign")) key = "assigned";
  else if (norm.includes("status")) key = "status_changed";
  else if (norm.includes("delet") || norm.includes("remov")) key = "deleted";
  else if (norm.includes("updat")) key = "updated";

  const cfg = ACTION_CONFIG[key] || ACTION_CONFIG.default;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.15rem 0.55rem",
        borderRadius: "99px",
        fontSize: "0.72rem",
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [projects, setProjects]     = useState([]);
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  const [filter, setFilter]         = useState("all");
  const [memberFilter, setMemberFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [search, setSearch]         = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [actRes, projRes, membRes] = await Promise.all([
        listFeedActivity({ limit: 60 }),
        listProjects({ limit: 50 }).catch(() => ({ data: { items: [] } })),
        listTeamMembers().catch(() => ({ data: { items: [] } })),
      ]);
      setActivities(actRes.data.items || []);
      setProjects(projRes.data.items || []);
      setMembers(membRes.data.items || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load activity stream."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = activities.filter(a => {
    // Action filter
    let matchAction = true;
    if (filter !== "all") {
      const actNorm = String(a.action || "").toLowerCase();
      if (filter === "completed") matchAction = actNorm.includes("complete") || actNorm.includes("done");
      else if (filter === "created") matchAction = actNorm.includes("creat");
      else if (filter === "updated") matchAction = actNorm.includes("updat") || actNorm.includes("status");
      else if (filter === "commented") matchAction = actNorm.includes("comment");
      else if (filter === "assigned") matchAction = actNorm.includes("assign");
    }

    // Member filter
    let matchMember = true;
    if (memberFilter) {
      const actorId = String(a.actor?.id || "");
      matchMember = actorId === memberFilter;
    }

    // Project filter
    let matchProject = true;
    if (projectFilter) {
      const projId = String(a.project?.id || "");
      matchProject = projId === projectFilter;
    }

    // Text search
    let matchSearch = true;
    if (search.trim()) {
      const q = search.toLowerCase();
      const actorName = String(a.actor?.name || "").toLowerCase();
      const summary = String(a.summary || "").toLowerCase();
      const taskTitle = String(a.task?.title || "").toLowerCase();
      const projName = String(a.project?.name || "").toLowerCase();
      matchSearch = actorName.includes(q) || summary.includes(q) || taskTitle.includes(q) || projName.includes(q);
    }

    return matchAction && matchMember && matchProject && matchSearch;
  });

  return (
    <section className="fade-in">
      <Toast message={error} type="error" onClose={() => setError("")} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        <div>
          <h1 className="page-title">Activity Feed</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            Real-time chronological events, task state changes, and team comments across your workspace.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadData}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh Feed
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "0.875rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="input"
          style={{ maxWidth: "16rem", flex: "1 1 12rem" }}
          placeholder="Search by user, task, or text…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Filter by Project */}
        {projects.length > 0 && (
          <select
            className="input"
            style={{ width: "auto" }}
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {/* Filter by Member */}
        {members.length > 0 && (
          <select
            className="input"
            style={{ width: "auto" }}
            value={memberFilter}
            onChange={e => setMemberFilter(e.target.value)}
          >
            <option value="">All Team Members</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}

        {/* Action Pills */}
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {["all", "completed", "created", "updated", "commented", "assigned"].map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "99px",
                border: "1px solid var(--border)",
                fontSize: "0.775rem",
                fontWeight: 600,
                cursor: "pointer",
                background: filter === f ? "var(--accent)" : "var(--surface)",
                color: filter === f ? "#fff" : "var(--muted)",
                transition: "all 120ms ease",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--muted)" }}>
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ display: "grid", gap: "0.875rem" }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: "4.5rem", borderRadius: "10px" }} />
          ))}
        </div>
      ) : (
        /* Timeline */
        <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
          {/* Vertical line */}
          <div
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "1.25rem",
              bottom: "1.25rem",
              width: "2px",
              background: "var(--border)",
            }}
          />

          <div style={{ display: "grid", gap: "1rem" }}>
            {filtered.length === 0 ? (
              <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
                No workspace activity matches your selected filters.
              </div>
            ) : (
              filtered.map(act => {
                const norm = String(act.action || "").toLowerCase();
                let key = "default";
                if (norm.includes("complete") || norm.includes("done")) key = "completed";
                else if (norm.includes("creat")) key = "created";
                else if (norm.includes("comment")) key = "commented";
                else if (norm.includes("assign")) key = "assigned";
                else if (norm.includes("status")) key = "status_changed";
                else if (norm.includes("delet") || norm.includes("remov")) key = "deleted";
                else if (norm.includes("updat")) key = "updated";
                const cfg = ACTION_CONFIG[key] || ACTION_CONFIG.default;

                return (
                  <div key={act.id} style={{ position: "relative" }}>
                    {/* Timeline dot */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-1.05rem",
                        top: "1.1rem",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: cfg.color,
                        border: "2px solid var(--surface)",
                        boxShadow: "0 0 0 2px " + cfg.color + "33",
                        zIndex: 1,
                      }}
                    />

                    <div
                      className="card"
                      style={{
                        padding: "1rem 1.25rem",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.875rem",
                        borderRadius: "10px",
                      }}
                    >
                      <Avatar name={act.actor?.name || "System"} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--ink)" }}>
                            {act.actor?.name || "System"}
                          </span>
                          <ActionBadge action={act.action} />
                        </div>

                        <p style={{ margin: 0, fontSize: "0.825rem", color: "var(--ink2)", lineHeight: 1.45 }}>
                          {act.summary}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.45rem", flexWrap: "wrap" }}>
                          {act.project && (
                            <Link
                              to={`/projects/${act.project.id}`}
                              style={{
                                fontSize: "0.725rem",
                                color: "var(--accent)",
                                fontWeight: 700,
                                background: "var(--accent-soft)",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "4px",
                                textDecoration: "none",
                              }}
                            >
                              {act.project.name || "Project"}
                            </Link>
                          )}
                          {act.task && (
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500 }}>
                              Task: <strong>{act.task.title}</strong>
                            </span>
                          )}
                          <span style={{ fontSize: "0.725rem", color: "var(--muted)", marginLeft: "auto" }}>
                            {formatRealTimeAgo(act.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
