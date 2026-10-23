import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard, getErrorMessage } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";
import { useAuth } from "../context/AuthContext.jsx";

const PRIORITY_COLOR = { low: "badge-gray", medium: "badge-blue", high: "badge-yellow", urgent: "badge-red" };
const STATUS_META = {
  todo:        { label: "To Do",       color: "#8b95ab" },
  in_progress: { label: "In Progress", color: "#4f6ef7" },
  in_review:   { label: "In Review",   color: "#d97c10" },
  done:        { label: "Done",        color: "#17a55e" },
  completed:   { label: "Done",        color: "#17a55e" },
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ margin: "0.5rem 0 0.25rem", fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.03em", color: accent || "var(--ink)", lineHeight: 1 }}>{value ?? 0}</p>
      {sub && <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user }          = useAuth();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    let active = true;
    getDashboard().then(r => { if (active) setData(r.data); }).catch(e => { if (active) setError(getErrorMessage(e, "Unable to load dashboard.")); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return (
    <section>
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))", marginTop: "1.5rem" }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "6rem", borderRadius: 12 }} />)}
      </div>
    </section>
  );
  if (error) return <p role="alert" style={{ color: "var(--red)" }}>{error}</p>;
  if (!data)  return null;

  const { metrics, taskStatus, dueSoon } = data;
  const total = taskStatus.reduce((s, x) => s + x.count, 0);

  return (
    <section className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>Welcome back, {user?.name?.split(" ")[0]}. Here is your workspace overview.</p>
        </div>
        <Link to="/projects" className="btn btn-primary">New project</Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "repeat(auto-fill, minmax(10.5rem, 1fr))", marginTop: "1.5rem" }}>
        <StatCard label="Projects"   value={metrics.totalProjects} sub="Accessible workspaces" />
        <StatCard label="My tasks"   value={metrics.assignedToMe}  sub="Assigned to me" />
        <StatCard label="In progress" value={metrics.inProgress}   sub="Active work items" accent="var(--accent)" />
        <StatCard label="Completed"  value={metrics.completed}      sub="Tasks finished" accent="var(--green)" />
      </div>

      {/* Overdue / upcoming */}
      {(metrics.overdue > 0 || metrics.upcoming > 0) && (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
          {metrics.overdue > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", background: "var(--red-soft)", border: "1px solid var(--red)", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 600, color: "var(--red)" }}>
              {metrics.overdue} overdue task{metrics.overdue !== 1 ? "s" : ""}
            </div>
          )}
          {metrics.upcoming > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", background: "var(--yellow-soft)", border: "1px solid var(--yellow)", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 600, color: "var(--yellow)" }}>
              {metrics.upcoming} due within 7 days
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1.3fr", marginTop: "1.25rem" }}>
        {/* Progress */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>Task breakdown</h2>
          {total === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No tasks yet.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.875rem" }}>
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const count = taskStatus.find(x => x.status === key)?.count || 0;
                const pct   = Math.round((count / total) * 100);
                return (
                  <li key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.35rem" }}>
                      <span style={{ fontWeight: 500, color: "var(--ink2)" }}>{meta.label}</span>
                      <span style={{ color: "var(--muted)" }}>{count} &middot; {pct}%</span>
                    </div>
                    <div style={{ height: 6, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <div style={{ width: pct + "%", height: "100%", background: meta.color, borderRadius: 99, transition: "width 600ms ease" }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Due soon */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
            <h2 className="section-title">Upcoming deadlines</h2>
            <Link to="/tasks" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-text)", textDecoration: "none" }}>View all</Link>
          </div>
          {dueSoon.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No upcoming deadlines.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {dueSoon.map((task, i) => (
                <li key={task.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", padding: "0.625rem 0", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{task.title}</p>
                    <p style={{ margin: "0.15rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>{task.project?.name}{task.assignee ? " · " + task.assignee.name : ""}</p>
                  </div>
                  <time style={{ fontSize: "0.775rem", color: "var(--muted)", whiteSpace: "nowrap", flexShrink: 0 }} dateTime={task.dueDate}>{formatDate(task.dueDate)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {metrics.totalProjects === 0 && (
        <div style={{ marginTop: "1.5rem", padding: "2rem", textAlign: "center", borderRadius: 14, border: "2px dashed var(--border)", background: "var(--surface)" }}>
          <p style={{ fontWeight: 600, fontSize: "1rem", margin: "0 0 0.5rem" }}>You have no projects yet</p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>Create a project to start planning and managing tasks with your team.</p>
          <Link to="/projects" className="btn btn-primary">Create your first project</Link>
        </div>
      )}
    </section>
  );
}
