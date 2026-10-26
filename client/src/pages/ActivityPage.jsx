import { useState } from "react";

const ACTION_CONFIG = {
  completed: { label: "completed", color: "#17a55e", bg: "#e8f8f0", icon: "✓" },
  created:   { label: "created",   color: "#7c52e8", bg: "#f1eefe", icon: "✦" },
  updated:   { label: "updated",   color: "#4f6ef7", bg: "#eef1fe", icon: "↻" },
  commented: { label: "commented", color: "#d97c10", bg: "#fef5e4", icon: "✎" },
  assigned:  { label: "assigned",  color: "#4f6ef7", bg: "#eef1fe", icon: "→" },
  deleted:   { label: "deleted",   color: "#d83a38", bg: "#fdeeed", icon: "✕" },
  default:   { label: "activity",  color: "#68728a", bg: "#f2f3f6", icon: "•" },
};

const MOCK = [
  { id: "1", actor: "Abdalle Hassan", action: "completed",  target: "Implement JWT & Refresh Token Authentication", time: "10 min ago",  project: "Auth System" },
  { id: "2", actor: "Alex Morgan",    action: "updated",    target: "Interactive Board with Drag & Drop",           time: "45 min ago",  project: "PM Tool" },
  { id: "3", actor: "Sarah Chen",     action: "commented",  target: "Design Onboarding & Welcome Flow in Figma",   time: "2 hours ago", project: "UI/UX Design" },
  { id: "4", actor: "Khalid Jama",    action: "assigned",   target: "Automate API Health Monitoring",              time: "5 hours ago", project: "DevOps" },
  { id: "5", actor: "Abdalle Hassan", action: "created",    target: "E-Commerce Platform Redesign",                time: "1 day ago",   project: "E-Commerce" },
  { id: "6", actor: "Mariam Farah",   action: "completed",  target: "Write Unit Tests for Dashboard API",          time: "2 days ago",  project: "QA" },
  { id: "7", actor: "Omar Salah",     action: "updated",    target: "Database Schema Migration v2",                time: "3 days ago",  project: "Backend" },
];

function ActorAvatar({ name }) {
  const colors = ["#4f6ef7","#7c52e8","#17a55e","#d97c10","#d83a38"];
  const color  = colors[(name || "").charCodeAt(0) % colors.length];
  const initials = (name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 38, height: 38, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, color: "#fff", fontSize: "0.8rem", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.25rem",
      padding: "0.15rem 0.55rem", borderRadius: "99px",
      fontSize: "0.72rem", fontWeight: 700,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function ActivityPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK.filter(a => {
    const matchAction = filter === "all" || a.action === filter;
    const matchSearch = !search ||
      a.actor.toLowerCase().includes(search.toLowerCase()) ||
      a.target.toLowerCase().includes(search.toLowerCase());
    return matchAction && matchSearch;
  });

  return (
    <section className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 className="page-title">Activity Feed</h1>
        <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
          Chronological stream of all project updates, task movements, and team comments.
        </p>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: "0.875rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="input"
          style={{ maxWidth: "18rem", flex: "0 1 18rem" }}
          placeholder="Search by person or task…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {["all", "completed", "created", "updated", "commented", "assigned"].map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                padding: "0.3rem 0.75rem", borderRadius: "99px",
                border: "1px solid var(--border2)", fontSize: "0.775rem",
                fontWeight: 600, cursor: "pointer",
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

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: "2rem" }}>
        {/* Vertical line */}
        <div style={{
          position: "absolute", left: "1.125rem", top: "1.5rem", bottom: "1.5rem",
          width: "2px", background: "var(--border)",
        }} />

        <div style={{ display: "grid", gap: "1rem" }}>
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
              No activity matches your filter.
            </div>
          ) : filtered.map(act => {
            const cfg = ACTION_CONFIG[act.action] || ACTION_CONFIG.default;
            return (
              <div key={act.id} style={{ position: "relative" }}>
                {/* Timeline dot */}
                <div style={{
                  position: "absolute", left: "-1.625rem", top: "1.1rem",
                  width: 12, height: 12, borderRadius: "50%",
                  background: cfg.color,
                  border: "2px solid var(--surface)",
                  boxShadow: "0 0 0 2px " + cfg.color + "44",
                  zIndex: 1,
                }} />

                <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.875rem" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
                >
                  <ActorAvatar name={act.actor} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--ink)" }}>{act.actor}</span>
                      <ActionBadge action={act.action} />
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--ink2)", lineHeight: 1.4 }}>
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>{act.target}</span>
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.4rem" }}>
                      <span style={{
                        fontSize: "0.72rem", color: "var(--accent)", fontWeight: 600,
                        background: "var(--accent-soft)", padding: "0.1rem 0.45rem", borderRadius: "4px",
                      }}>
                        {act.project}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{act.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
