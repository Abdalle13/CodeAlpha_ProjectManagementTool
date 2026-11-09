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

/* SVG Icons */
const IcoCalendar = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoCheck = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoClock = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IcoTarget = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IcoLayers = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);
const IcoBoard = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
  </svg>
);
const IcoPlus = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoAlert = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoArrow = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
  </svg>
);
const IcoTrend = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);

const STATUS_CONFIG = {
  todo:        { label: "To Do",       color: "#94a3b8", bg: "rgba(148,163,184,.14)" },
  in_progress: { label: "In Progress", color: "#3b82f6", bg: "rgba(59,130,246,.14)"  },
  review:      { label: "In Review",   color: "#f59e0b", bg: "rgba(245,158,11,.14)"  },
  in_review:   { label: "In Review",   color: "#f59e0b", bg: "rgba(245,158,11,.14)"  },
  done:        { label: "Completed",   color: "#10b981", bg: "rgba(16,185,129,.14)"  },
  completed:   { label: "Completed",   color: "#10b981", bg: "rgba(16,185,129,.14)"  },
};

const PRIORITY_DOT = {
  urgent: "#f05454",
  high:   "#f59e0b",
  medium: "#4f6ef7",
  low:    "#94a3b8",
};

/* Metric Card */
function MetricCard({ title, value, sub, icon, color, trend }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "1.2rem 1.3rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.65rem",
      boxShadow: "var(--shadow-sm)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle colored top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: "3px", background: color, borderRadius: "16px 16px 0 0",
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.07em", color: "var(--muted)",
        }}>
          {title}
        </span>
        <div style={{
          width: 36, height: 36, borderRadius: "10px",
          background: `${color}18`, color,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
      </div>

      <div style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--ink)", lineHeight: 1 }}>
        {value}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {trend != null && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.2rem",
            fontSize: "0.72rem", fontWeight: 700,
            color: "var(--green)", background: "var(--green-soft)",
            padding: "2px 7px", borderRadius: "999px",
          }}>
            <IcoTrend size={11} />
            {trend}
          </span>
        )}
        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{sub}</span>
      </div>
    </div>
  );
}

/* Circular Gauge */
function CompletionRing({ percentage, completed, total }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, percentage)) / 100) * circ;
  const statusLabel = percentage >= 100 ? "All done" : percentage >= 60 ? "Great pace" : percentage >= 30 ? "In progress" : "Just started";
  const statusColor = percentage >= 100 ? "var(--green)" : percentage >= 60 ? "var(--accent)" : percentage >= 30 ? "var(--yellow)" : "var(--muted)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "0.5rem 0" }}>
      <div style={{ position: "relative", width: 128, height: 128, flexShrink: 0 }}>
        <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="64" cy="64" r={r} fill="transparent" stroke="var(--surface2)" strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="transparent"
            stroke="var(--accent)" strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
            {percentage}%
          </span>
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--muted)", marginTop: "2px" }}>done</span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          padding: "0.3rem 0.8rem", borderRadius: "999px",
          background: "var(--surface2)", fontSize: "0.78rem",
          fontWeight: 700, color: statusColor, marginBottom: "0.6rem",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
          {statusLabel}
        </div>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.2rem" }}>
          {completed} tasks completed
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
          {total - completed} remaining out of {total} total
        </div>

        {/* Mini bar */}
        <div style={{
          marginTop: "0.75rem", height: "5px",
          background: "var(--surface2)", borderRadius: "99px", overflow: "hidden",
        }}>
          <div style={{
            width: `${percentage}%`, height: "100%",
            background: "var(--accent)", borderRadius: "99px",
            transition: "width 600ms ease",
          }} />
        </div>
      </div>
    </div>
  );
}

/* Avatar initials */
function Avatar({ name, color, size = 28 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color || "var(--accent)", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
      border: "2px solid var(--surface)",
    }}>
      {initials}
    </div>
  );
}

/* Section header */
function SectionHeader({ title, sub, to, linkLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "0.975rem", fontWeight: 700, color: "var(--ink)" }}>{title}</h2>
        {sub && <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>{sub}</p>}
      </div>
      {to && (
        <Link to={to} style={{
          fontSize: "0.775rem", fontWeight: 600, color: "var(--accent)",
          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem",
          whiteSpace: "nowrap",
        }}>
          {linkLabel} <IcoArrow size={12} />
        </Link>
      )}
    </div>
  );
}

/* Empty state */
function EmptySlot({ message }) {
  return (
    <div style={{
      padding: "2.25rem 1rem", textAlign: "center",
      background: "var(--surface2)", borderRadius: "12px",
      border: "1px dashed var(--border)", color: "var(--muted)",
      fontSize: "0.84rem",
    }}>
      {message}
    </div>
  );
}

/* Card wrapper */
function Card({ children, style }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "1.3rem 1.4rem",
      boxShadow: "var(--shadow-sm)",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD PAGE
   ========================================================= */
export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const todayStr = useMemo(() =>
    new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
  []);

  useEffect(() => {
    let alive = true;
    getDashboard()
      .then(r => { if (alive) setData(r.data); })
      .catch(e => { if (alive) setError(getErrorMessage(e, "Unable to load workspace.")); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <section className="fade-in" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "3rem" }}>
        <div className="skeleton" style={{ height: "5.5rem", borderRadius: 16, marginBottom: "1.25rem" }} />
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))", marginBottom: "1.25rem" }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "7rem", borderRadius: 16 }} />)}
        </div>
        <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "1.1fr 1fr" }}>
          <div className="skeleton" style={{ height: "24rem", borderRadius: 16 }} />
          <div className="skeleton" style={{ height: "24rem", borderRadius: 16 }} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: 1200, margin: "1.5rem auto", padding: "1.4rem",
        borderRadius: 14, background: "var(--red-soft)",
        border: "1px solid rgba(220,38,38,.22)", color: "var(--red)", fontWeight: 600,
      }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { metrics = {}, taskStatus = [], projectProgress = [], dueSoon = [] } = data;
  const totalTasks      = metrics.totalTasks || 0;
  const completedCount  = metrics.completed  || 0;
  const completionRate  = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const statusChartData = taskStatus
    .map(item => {
      const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: "#64748b" };
      return { name: cfg.label, value: item.count, color: cfg.color };
    })
    .filter(x => x.value > 0);

  const visibleDue      = dueSoon.slice(0, 5);
  const visibleProjects = projectProgress.slice(0, 5);
  const firstName       = user?.name ? user.name.split(" ")[0] : "there";

  return (
    <section className="fade-in" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "3rem" }}>

      {/* ── HERO HEADER ────────────────────────────────────────────── */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "18px",
        padding: "1.5rem 1.75rem",
        marginBottom: "1.25rem",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.25rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow accent */}
        <div style={{
          position: "absolute", right: -60, top: -60,
          width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,110,247,.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ flex: "1 1 18rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
            <Avatar name={user?.name} color={user?.avatarColor || "var(--accent)"} size={42} />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.035em", color: "var(--ink)" }}>
                {greeting}, {firstName}
              </h1>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>
                Here is your workspace overview for today.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            background: "var(--surface2)", padding: "0.5rem 0.9rem",
            borderRadius: "10px", fontSize: "0.8rem", fontWeight: 600,
            color: "var(--ink2)", border: "1px solid var(--border)", whiteSpace: "nowrap",
          }}>
            <IcoCalendar size={13} />
            {todayStr}
          </div>
          <Link to="/tasks" className="btn btn-secondary" style={{ gap: "0.4rem", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap" }}>
            <IcoBoard size={14} /> Task Board
          </Link>
          <Link to="/projects" className="btn btn-primary" style={{ gap: "0.4rem", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap" }}>
            <IcoPlus size={14} /> New Project
          </Link>
        </div>
      </div>

      {/* ── OVERDUE ALERT ─────────────────────────────────────────── */}
      {metrics.overdue > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "0.75rem",
          padding: "0.85rem 1.15rem",
          background: "var(--red-soft)", border: "1px solid rgba(220,38,38,.2)",
          borderRadius: "12px", fontSize: "0.84rem", fontWeight: 600,
          color: "var(--red)", marginBottom: "1.25rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <IcoAlert size={15} />
            <span>
              {metrics.overdue} task{metrics.overdue !== 1 ? "s are" : " is"} past the target deadline.
            </span>
          </div>
          <Link to="/tasks" style={{ color: "var(--red)", fontSize: "0.79rem", fontWeight: 700, textDecoration: "underline" }}>
            Review overdue
          </Link>
        </div>
      )}

      {/* ── METRIC CARDS ──────────────────────────────────────────── */}
      <div style={{
        display: "grid", gap: "1rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 11rem), 1fr))",
        marginBottom: "1.35rem",
      }}>
        <MetricCard title="Assigned to Me"  value={metrics.assignedToMe ?? 0} sub="your action items"       color="#4f6ef7" icon={<IcoTarget size={17} />} />
        <MetricCard title="In Progress"     value={metrics.inProgress  ?? 0} sub="active right now"         color="#3b82f6" icon={<IcoClock  size={17} />} />
        <MetricCard title="Completed"       value={metrics.completed   ?? 0} sub="finished this sprint"     color="#10b981" icon={<IcoCheck  size={17} />} trend={completionRate > 0 ? `${completionRate}%` : null} />
        <MetricCard title="Active Projects" value={metrics.totalProjects?? 0} sub="assigned team workspaces" color="#8b5cf6" icon={<IcoLayers size={17} />} />
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────── */}
      <div style={{
        display: "grid", gap: "1.25rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))",
        alignItems: "start",
      }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Upcoming Deadlines */}
          <Card>
            <SectionHeader title="Upcoming Deadlines" sub="Next 5 scheduled deliverables" to="/tasks" linkLabel="All tasks" />

            {visibleDue.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "2rem 1rem", textAlign: "center",
                background: "var(--surface2)", borderRadius: "12px",
                border: "1px dashed var(--border)",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--green-soft)", color: "var(--green)",
                  display: "grid", placeItems: "center", marginBottom: "0.6rem",
                }}>
                  <IcoCheck size={18} />
                </div>
                <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.9rem" }}>All caught up</div>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                  No deadlines due in the next 7 days.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {visibleDue.map((task) => {
                  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                  const priorityColor = PRIORITY_DOT[task.priority] || "#94a3b8";
                  return (
                    <div key={task.id} style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.8rem 1rem",
                      background: "var(--surface2)", borderRadius: "11px",
                      border: "1px solid var(--border)",
                    }}>
                      {/* Priority dot */}
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: priorityColor, flexShrink: 0,
                      }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: "0 0 0.2rem", fontSize: "0.875rem", fontWeight: 600,
                          color: "var(--ink)", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {task.title}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
                            padding: "1px 6px", borderRadius: "4px",
                            background: cfg.bg, color: cfg.color,
                          }}>
                            {cfg.label}
                          </span>
                          {task.project?.name && (
                            <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                              in {task.project.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{
                        display: "flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.3rem 0.6rem", borderRadius: "7px",
                        background: "var(--surface)", border: "1px solid var(--border)",
                        fontSize: "0.73rem", fontWeight: 600, color: "var(--ink2)",
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        <IcoCalendar size={12} />
                        {formatDate(task.dueDate)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Project Progress */}
          <Card>
            <SectionHeader title="Project Progress" sub="Top workspaces by completion" to="/projects" linkLabel="All projects" />

            {visibleProjects.length === 0 ? (
              <EmptySlot message="You are not assigned to any projects yet." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                {visibleProjects.map((proj) => {
                  const done = proj.progress === 100;
                  const barColor = done ? "var(--green)" : "var(--accent)";
                  return (
                    <Link key={proj.id} to={`/projects/${proj.id}`} style={{
                      display: "block", padding: "0.9rem 1rem",
                      background: "var(--surface2)", borderRadius: "12px",
                      border: "1px solid var(--border)", textDecoration: "none", color: "inherit",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                          <div style={{
                            width: 7, height: 7, borderRadius: "50%",
                            background: barColor, flexShrink: 0,
                          }} />
                          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {proj.name}
                          </span>
                        </div>
                        <span style={{
                          fontSize: "0.775rem", fontWeight: 700,
                          color: done ? "var(--green)" : "var(--accent)",
                          background: done ? "var(--green-soft)" : "var(--accent-soft)",
                          padding: "2px 9px", borderRadius: "999px", flexShrink: 0,
                        }}>
                          {proj.progress}%
                        </span>
                      </div>

                      <div style={{ height: "5px", background: "var(--border)", borderRadius: "99px", overflow: "hidden", marginBottom: "0.4rem" }}>
                        <div style={{
                          width: `${proj.progress}%`, height: "100%",
                          background: barColor, borderRadius: "99px",
                          transition: "width 400ms ease",
                        }} />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--muted)" }}>
                        <span>{proj.completed} of {proj.total} done</span>
                        <span>{proj.total - proj.completed} remaining</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Completion Ring */}
          <Card>
            <SectionHeader title="Overall Completion" sub="Across all your accessible tasks" />
            <CompletionRing percentage={completionRate} completed={completedCount} total={totalTasks} />
          </Card>

          {/* Task Status Donut */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "0.975rem", fontWeight: 700, color: "var(--ink)" }}>
                  Task Status Breakdown
                </h2>
                <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
                  Distribution by current state
                </p>
              </div>
              <span style={{
                fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)",
                background: "var(--surface2)", padding: "3px 9px", borderRadius: "7px",
                border: "1px solid var(--border)",
              }}>
                {totalTasks} tasks
              </span>
            </div>

            {statusChartData.length === 0 ? (
              <EmptySlot message="No tasks logged yet." />
            ) : (
              <div>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={72}
                        paddingAngle={4} dataKey="value"
                      >
                        {statusChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="var(--surface)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{
                        background: "var(--surface)", borderColor: "var(--border)",
                        borderRadius: 10, color: "var(--ink)", fontSize: "0.8rem",
                        boxShadow: "var(--shadow)",
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.75rem" }}>
                  {statusChartData.map((item) => (
                    <div key={item.name} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.45rem 0.7rem",
                      background: "var(--surface2)", borderRadius: "9px",
                      border: "1px solid var(--border)", fontSize: "0.75rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: "var(--ink)" }}>{item.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--muted)" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Quick Links */}
          <Card>
            <SectionHeader title="Quick Actions" sub="Jump to key areas" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              {[
                { to: "/tasks",     label: "All Tasks",    icon: <IcoCheck size={15} />,  color: "#10b981" },
                { to: "/projects",  label: "Projects",     icon: <IcoLayers size={15} />, color: "#8b5cf6" },
                { to: "/team",      label: "Team",         icon: <IcoTarget size={15} />, color: "#f59e0b" },
                { to: "/activity",  label: "Activity",     icon: <IcoClock size={15} />,  color: "#3b82f6" },
              ].map(item => (
                <Link key={item.to} to={item.to} style={{
                  display: "flex", alignItems: "center", gap: "0.55rem",
                  padding: "0.7rem 0.9rem",
                  background: "var(--surface2)", borderRadius: "11px",
                  border: "1px solid var(--border)", textDecoration: "none",
                  color: "var(--ink)", fontSize: "0.84rem", fontWeight: 600,
                  transition: "border-color 140ms, background 140ms",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "8px",
                    background: `${item.color}18`, color: item.color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  {item.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
