import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getDashboard, getErrorMessage } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

/* ─── Vector Icons (Pure SVG - No Emojis) ────────────────────────── */
const IcoCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IcoCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IcoClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IcoTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IcoLayers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IcoBoard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const IcoPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IcoAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IcoArrowUpRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

/* ─── Status Configurations ──────────────────────────────────────── */
const STATUS_CONFIG = {
  todo: { label: "To Do", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.14)" },
  in_progress: { label: "In Progress", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.14)" },
  in_review: { label: "In Review", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.14)" },
  done: { label: "Completed", color: "#10b981", bg: "rgba(16, 185, 129, 0.14)" },
  completed: { label: "Completed", color: "#10b981", bg: "rgba(16, 185, 129, 0.14)" },
};

/* ─── User Metric Card Component ─────────────────────────────────── */
function MetricTile({ title, value, sub, icon, accentColor }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "1.15rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <span
          style={{
            fontSize: "0.725rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--muted)",
            display: "block",
            marginBottom: "0.3rem",
          }}
        >
          {title}
        </span>
        <div
          style={{
            fontSize: "1.85rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "var(--ink)",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.35rem" }}>
          {sub}
        </div>
      </div>

      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: accentColor ? `${accentColor}18` : "var(--surface2)",
          color: accentColor || "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

/* ─── Circular Completion Gauge ──────────────────────────────────── */
function CompletionGauge({ percentage, completed, total }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  let statusLabel = "Getting started";
  let statusColor = "var(--muted)";
  if (percentage >= 100) {
    statusLabel = "All caught up";
    statusColor = "var(--green)";
  } else if (percentage >= 60) {
    statusLabel = "Strong momentum";
    statusColor = "var(--accent)";
  } else if (percentage >= 30) {
    statusLabel = "In progress";
    statusColor = "var(--yellow)";
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem 0.5rem",
      }}
    >
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="var(--surface2)"
            strokeWidth="9"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="var(--accent)"
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
            {percentage}%
          </span>
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--muted)", marginTop: "2px" }}>
            Done
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.25rem 0.75rem",
          borderRadius: "999px",
          background: "var(--surface2)",
          fontSize: "0.775rem",
          fontWeight: 600,
          color: statusColor,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
        {statusLabel}
      </div>

      <div style={{ fontSize: "0.775rem", color: "var(--muted)", marginTop: "0.4rem", textAlign: "center" }}>
        {completed} of {total} tasks completed
      </div>
    </div>
  );
}

/* ─── Main User Dashboard Page ───────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const todayDateString = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

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
      <section className="fade-in" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "2.5rem" }}>
        <div style={{ height: "4.5rem", borderRadius: "14px", marginBottom: "1.5rem" }} className="skeleton" />
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
            marginBottom: "1.5rem",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "6.5rem", borderRadius: "14px" }} />
          ))}
        </div>
        <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "1.2fr 1fr" }}>
          <div className="skeleton" style={{ height: "22rem", borderRadius: "14px" }} />
          <div className="skeleton" style={{ height: "22rem", borderRadius: "14px" }} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "1.5rem auto",
          padding: "1.5rem",
          borderRadius: "14px",
          background: "var(--red-soft)",
          border: "1px solid rgba(220, 38, 38, 0.25)",
          color: "var(--red)",
          fontWeight: 600,
        }}
      >
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { metrics = {}, taskStatus = [], projectProgress = [], dueSoon = [] } = data;
  const totalTasks = metrics.totalTasks || 0;
  const completedCount = metrics.completed || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Task Status chart data
  const statusChartData = taskStatus
    .map((item) => {
      const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: "#64748b" };
      return {
        name: cfg.label,
        value: item.count,
        color: cfg.color,
      };
    })
    .filter((x) => x.value > 0);

  // Limit to 5 items maximum for overview
  const visibleDueSoon = dueSoon.slice(0, 5);
  const visibleProjects = projectProgress.slice(0, 5);

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  return (
    <section className="fade-in" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* ─── Top Human Header & Actions ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.25rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)" }}>
              {greeting}, {firstName}
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--muted)" }}>
            Here is your daily workspace focus and upcoming deliverables.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              background: "var(--surface2)",
              padding: "0.45rem 0.85rem",
              borderRadius: "10px",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--ink2)",
              border: "1px solid var(--border)",
            }}
          >
            <IcoCalendar />
            <span>{todayDateString}</span>
          </div>

          <Link
            to="/tasks"
            className="btn btn-secondary"
            style={{ gap: "0.45rem", fontSize: "0.825rem", fontWeight: 600 }}
          >
            <IcoBoard />
            Task Board
          </Link>

          <Link
            to="/projects"
            className="btn btn-primary"
            style={{ gap: "0.45rem", fontSize: "0.825rem", fontWeight: 600 }}
          >
            <IcoPlus />
            Browse Projects
          </Link>
        </div>
      </div>

      {/* ─── Overdue Banner (Conditional) ───────────────────────────────── */}
      {metrics.overdue > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            padding: "0.85rem 1.15rem",
            background: "var(--red-soft)",
            border: "1px solid rgba(220, 38, 38, 0.2)",
            borderRadius: "12px",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--red)",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <IcoAlert />
            <span>
              You have {metrics.overdue} task{metrics.overdue !== 1 ? "s" : ""} past the target deadline.
            </span>
          </div>
          <Link
            to="/tasks"
            style={{
              color: "var(--red)",
              fontSize: "0.8rem",
              fontWeight: 700,
              textDecoration: "underline",
            }}
          >
            Review overdue tasks →
          </Link>
        </div>
      )}

      {/* ─── Personal Productivity Ribbon (4 Focused Metrics) ────────────── */}
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))",
          marginBottom: "1.5rem",
        }}
      >
        <MetricTile
          title="Assigned to Me"
          value={metrics.assignedToMe ?? 0}
          sub="Your pending action items"
          accentColor="var(--accent)"
          icon={<IcoTarget />}
        />

        <MetricTile
          title="In Progress"
          value={metrics.inProgress ?? 0}
          sub="Active right now"
          accentColor="#3b82f6"
          icon={<IcoClock />}
        />

        <MetricTile
          title="Completed"
          value={metrics.completed ?? 0}
          sub="Finished this sprint"
          accentColor="#10b981"
          icon={<IcoCheck />}
        />

        <MetricTile
          title="Active Projects"
          value={metrics.totalProjects ?? 0}
          sub="Assigned team spaces"
          accentColor="#8b5cf6"
          icon={<IcoLayers />}
        />
      </div>

      {/* ─── Main 2-Column Focus Layout ──────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gap: "1.25rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))",
          alignItems: "start",
        }}
      >
        {/* ─── LEFT COLUMN: Daily Workstream & Deadlines ─────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Card: Upcoming Deadlines (Max 5) */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "1.35rem 1.5rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.1rem",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>
                  Upcoming Deadlines
                </h2>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>
                  Overview of next 5 scheduled deliverables
                </p>
              </div>
              <Link
                to="/tasks"
                style={{
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  color: "var(--accent)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <span>See all tasks</span>
                <IcoArrowUpRight />
              </Link>
            </div>

            {visibleDueSoon.length === 0 ? (
              <div
                style={{
                  padding: "2.5rem 1rem",
                  textAlign: "center",
                  color: "var(--muted)",
                  fontSize: "0.85rem",
                  background: "var(--surface2)",
                  borderRadius: "12px",
                  border: "1px dashed var(--border)",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "var(--green-soft)",
                    color: "var(--green)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 0.6rem",
                  }}
                >
                  <IcoCheck />
                </div>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>All caught up!</div>
                <div style={{ fontSize: "0.78rem", marginTop: "0.2rem" }}>
                  No pending deadlines due in the next 7 days.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {visibleDueSoon.map((task) => {
                  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.85rem",
                        padding: "0.75rem 0.95rem",
                        background: "var(--surface2)",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.25rem" }}>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: statusCfg.bg,
                              color: statusCfg.color,
                            }}
                          >
                            {statusCfg.label}
                          </span>
                          {task.project?.name && (
                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--muted)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              in {task.project.name}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--ink)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.title}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.3rem 0.6rem",
                          borderRadius: "6px",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--ink2)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        <IcoCalendar />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card: Project Progress (Max 5) */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "1.35rem 1.5rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.1rem",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>
                  Project Progress
                </h2>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>
                  Top 5 workspaces by completion activity
                </p>
              </div>
              <Link
                to="/projects"
                style={{
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  color: "var(--accent)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <span>See all projects</span>
                <IcoArrowUpRight />
              </Link>
            </div>

            {visibleProjects.length === 0 ? (
              <div
                style={{
                  padding: "2rem 1rem",
                  textAlign: "center",
                  color: "var(--muted)",
                  fontSize: "0.85rem",
                  background: "var(--surface2)",
                  borderRadius: "12px",
                }}
              >
                You are not assigned to any projects yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {visibleProjects.map((proj) => {
                  const isDone = proj.progress === 100;
                  return (
                    <Link
                      key={proj.id}
                      to={`/projects/${proj.id}`}
                      style={{
                        display: "block",
                        padding: "0.85rem 1rem",
                        background: "var(--surface2)",
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "border-color 140ms ease, background 140ms ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--ink)" }}>
                          {proj.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.775rem",
                            fontWeight: 700,
                            color: isDone ? "var(--green)" : "var(--accent)",
                            background: isDone ? "var(--green-soft)" : "var(--accent-soft)",
                            padding: "2px 8px",
                            borderRadius: "999px",
                          }}
                        >
                          {proj.progress}%
                        </span>
                      </div>

                      <div
                        style={{
                          height: "6px",
                          background: "var(--border)",
                          borderRadius: "99px",
                          overflow: "hidden",
                          marginBottom: "0.4rem",
                        }}
                      >
                        <div
                          style={{
                            width: `${proj.progress}%`,
                            height: "100%",
                            background: isDone ? "var(--green)" : "var(--accent)",
                            borderRadius: "99px",
                            transition: "width 400ms ease",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.725rem",
                          color: "var(--muted)",
                        }}
                      >
                        <span>{proj.completed} of {proj.total} tasks completed</span>
                        <span>{proj.total - proj.completed} remaining</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Focus Intelligence ──────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Card: Sprint Completion Gauge */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "1.35rem 1.5rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ marginBottom: "0.5rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>
                Sprint Completion
              </h2>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>
                Overall progress of your accessible tasks
              </p>
            </div>

            <CompletionGauge
              percentage={completionRate}
              completed={completedCount}
              total={totalTasks}
            />
          </div>

          {/* Card: Status Distribution (Donut Chart) */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "1.35rem 1.5rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>
                  Task Status Breakdown
                </h2>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>
                  Distribution across states
                </p>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--muted)",
                  background: "var(--surface2)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                }}
              >
                {totalTasks} total
              </span>
            </div>

            {statusChartData.length === 0 ? (
              <div
                style={{
                  padding: "1.75rem 1rem",
                  textAlign: "center",
                  color: "var(--muted)",
                  fontSize: "0.85rem",
                  background: "var(--surface2)",
                  borderRadius: "10px",
                }}
              >
                No tasks logged yet.
              </div>
            ) : (
              <div>
                <div style={{ height: "170px", position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`donut-${index}`} fill={entry.color} stroke="var(--surface)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                          borderRadius: "10px",
                          color: "var(--ink)",
                          boxShadow: "var(--shadow)",
                          fontSize: "0.8rem",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {statusChartData.map((item) => (
                    <div
                      key={item.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.4rem 0.65rem",
                        background: "var(--surface2)",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
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
        </div>
      </div>
    </section>
  );
}
