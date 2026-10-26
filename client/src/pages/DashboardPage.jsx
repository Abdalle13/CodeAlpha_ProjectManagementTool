import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard, getErrorMessage } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const STATUS_CONFIG = {
  todo: { label: "To Do", color: "#94a3b8" },
  in_progress: { label: "In Progress", color: "#3b82f6" },
  in_review: { label: "In Review", color: "#f59e0b" },
  done: { label: "Completed", color: "#10b981" },
  completed: { label: "Completed", color: "#10b981" },
};

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "#ef4444" },
  high: { label: "High", color: "#f97316" },
  medium: { label: "Medium", color: "#3b82f6" },
  low: { label: "Low", color: "#10b981" },
};

function KpiCard({ title, value, sub, icon: Icon, accent, progress }) {
  return (
    <div
      className="card"
      style={{
        padding: "1.25rem",
        borderRadius: "14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 140ms ease, box-shadow 140ms ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {title}
          </span>
          <p style={{ margin: "0.35rem 0 0", fontSize: "1.875rem", fontWeight: 800, color: accent || "var(--ink)", lineHeight: 1.1 }}>
            {value}
          </p>
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            background: accent ? `${accent}18` : "var(--accent-soft)",
            color: accent || "var(--accent)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {Icon}
        </div>
      </div>

      <div style={{ marginTop: "0.75rem" }}>
        {progress !== undefined && (
          <div style={{ height: "5px", background: "var(--border)", borderRadius: "99px", overflow: "hidden", marginBottom: "0.45rem" }}>
            <div style={{ width: `${Math.min(100, progress)}%`, height: "100%", background: accent || "var(--accent)", borderRadius: "99px" }} />
          </div>
        )}
        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{sub}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getDashboard()
      .then((r) => {
        if (active) setData(r.data);
      })
      .catch((e) => {
        if (active) setError(getErrorMessage(e, "Unable to load workspace overview."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="fade-in">
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))", marginBottom: "1.5rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "7.5rem", borderRadius: 14 }} />
          ))}
        </div>
        <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "1fr 1fr" }}>
          <div className="skeleton" style={{ height: "20rem", borderRadius: 14 }} />
          <div className="skeleton" style={{ height: "20rem", borderRadius: 14 }} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1.5rem", borderRadius: "12px", background: "var(--red-soft)", color: "var(--red)" }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { metrics, taskStatus = [], taskPriority = [], projectProgress = [], dueSoon = [] } = data;
  const totalTasks = metrics.totalTasks || 0;
  const completedCount = metrics.completed || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Prepare Task Status chart data
  const statusChartData = taskStatus.map((item) => {
    const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: "#64748b" };
    return {
      name: cfg.label,
      value: item.count,
      color: cfg.color,
    };
  }).filter((x) => x.value > 0);

  // Prepare Task Priority chart data
  const priorityChartData = taskPriority.map((item) => {
    const cfg = PRIORITY_CONFIG[item.priority] || { label: item.priority, color: "#3b82f6" };
    return {
      name: cfg.label,
      count: item.count,
      color: cfg.color,
    };
  });

  return (
    <section className="fade-in" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "2.5rem" }}>
      {/* Header Greeting & Fast Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Home</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            Welcome back, {user?.name?.split(" ")[0] || "User"}. Here is your active workspace breakdown.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link to="/tasks" className="btn btn-secondary" style={{ gap: "0.5rem" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
            Task Board
          </Link>
          <Link to="/projects" className="btn btn-primary" style={{ gap: "0.5rem" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Project
          </Link>
        </div>
      </div>

      {/* Overdue Banner if any */}
      {metrics.overdue > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            background: "var(--red-soft)",
            border: "1px solid rgba(220, 38, 38, 0.25)",
            borderRadius: "10px",
            fontSize: "0.84rem",
            fontWeight: 600,
            color: "var(--red)",
            marginBottom: "1.25rem",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>You have {metrics.overdue} task{metrics.overdue !== 1 ? "s" : ""} past the target deadline.</span>
          <Link to="/tasks" style={{ marginLeft: "auto", color: "var(--red)", textDecoration: "underline", fontSize: "0.8rem" }}>Review overdue</Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13.5rem), 1fr))",
          marginBottom: "1.5rem",
        }}
      >
        <KpiCard
          title="Active Projects"
          value={metrics.totalProjects}
          sub="Workspaces you participate in"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/></svg>}
        />
        <KpiCard
          title="Assigned to Me"
          value={metrics.assignedToMe}
          sub="Your personal work items"
          accent="var(--accent)"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        />
        <KpiCard
          title="In Progress"
          value={metrics.inProgress}
          sub="Tasks actively under execution"
          accent="#3b82f6"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <KpiCard
          title="Sprint Completion"
          value={`${completionRate}%`}
          sub={`${completedCount} of ${totalTasks} tasks finished`}
          accent="#10b981"
          progress={completionRate}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        />
      </div>

      {/* Charts Section: 2 Columns */}
      <div
        style={{
          display: "grid",
          gap: "1.25rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
          marginBottom: "1.5rem",
        }}
      >
        {/* Chart 1: Task Status Donut Chart */}
        <div className="card" style={{ padding: "1.5rem", borderRadius: "14px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>Task Status Breakdown</h2>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>Distribution across all your project tasks</p>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", background: "var(--surface2)", padding: "2px 8px", borderRadius: "6px" }}>
              {totalTasks} total
            </span>
          </div>

          {statusChartData.length === 0 ? (
            <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "2rem", color: "var(--muted)", fontSize: "0.85rem" }}>
              No tasks found in your projects yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ height: "180px", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        color: "var(--ink)",
                        boxShadow: "var(--shadow)",
                        fontSize: "0.8rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Chips */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                {statusChartData.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.45rem 0.65rem",
                      background: "var(--surface2)",
                      borderRadius: "8px",
                      fontSize: "0.775rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: "var(--muted)" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Task Priority BarChart */}
        <div className="card" style={{ padding: "1.5rem", borderRadius: "14px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>Tasks by Priority</h2>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>Workload urgency across your sprints</p>
            </div>
            <Link to="/tasks" style={{ fontSize: "0.775rem", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
              Filter tasks →
            </Link>
          </div>

          {priorityChartData.length === 0 ? (
            <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "2rem", color: "var(--muted)", fontSize: "0.85rem" }}>
              No priority data available.
            </div>
          ) : (
            <div style={{ height: "230px", marginTop: "auto" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "var(--surface2)", opacity: 0.5 }}
                    contentStyle={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      color: "var(--ink)",
                      boxShadow: "var(--shadow)",
                      fontSize: "0.8rem",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Active Projects Progress & Upcoming Deadlines */}
      <div
        style={{
          display: "grid",
          gap: "1.25rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
        }}
      >
        {/* Active Projects Progress */}
        <div className="card" style={{ padding: "1.5rem", borderRadius: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>Project Progress</h2>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>Completion rate for your active projects</p>
            </div>
            <Link to="/projects" style={{ fontSize: "0.775rem", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
              All projects
            </Link>
          </div>

          {projectProgress.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", padding: "1.5rem 0" }}>
              You are not assigned to any projects yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {projectProgress.map((proj) => (
                <Link
                  key={proj.id}
                  to={`/projects/${proj.id}`}
                  style={{
                    display: "block",
                    padding: "0.75rem 0.875rem",
                    background: "var(--surface2)",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "border-color 140ms ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--ink)" }}>{proj.name}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.8rem", color: proj.progress === 100 ? "#10b981" : "var(--accent)" }}>
                      {proj.progress}%
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "var(--border)", borderRadius: "99px", overflow: "hidden", marginBottom: "0.35rem" }}>
                    <div
                      style={{
                        width: `${proj.progress}%`,
                        height: "100%",
                        background: proj.progress === 100 ? "#10b981" : "var(--accent)",
                        borderRadius: "99px",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.725rem", color: "var(--muted)" }}>
                    <span>{proj.completed} of {proj.total} tasks completed</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="card" style={{ padding: "1.5rem", borderRadius: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>Upcoming Deadlines</h2>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>Due soon across your workspace</p>
            </div>
            <Link to="/tasks" style={{ fontSize: "0.775rem", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
              View board
            </Link>
          </div>

          {dueSoon.length === 0 ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 0.5rem", opacity: 0.6 }}>
                <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
              </svg>
              No upcoming deadlines this week. You are all caught up!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {dueSoon.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 0.85rem",
                    background: "var(--surface2)",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.title}
                    </p>
                    <p style={{ margin: "0.15rem 0 0", fontSize: "0.725rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.project?.name || "Workspace"}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--ink2)",
                      background: "var(--surface)",
                      padding: "0.25rem 0.55rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(t.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
