import { useEffect, useState } from "react";
import { getAdminStats, getErrorMessage } from "../lib/api.js";
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

const PROJECT_STATUS_COLORS = {
  active: "#3b82f6",
  planning: "#8b5cf6",
  paused: "#f59e0b",
  completed: "#10b981",
  archived: "#64748b",
};

const TASK_STATUS_COLORS = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  in_review: "#f59e0b",
  done: "#10b981",
  completed: "#10b981",
};

function StatCard({ label, value, sub, accentColor = "var(--ink)" }) {
  return (
    <div
      className="card"
      style={{
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <h2 style={{ margin: "0.5rem 0 0.25rem", fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.03em", color: accentColor, lineHeight: 1.1 }}>
        {value}
      </h2>
      {sub && <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{sub}</span>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");
    getAdminStats()
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        setError(getErrorMessage(err, "Failed to load dashboard metrics."));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <section className="fade-in">
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))", marginBottom: "1.5rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "6.5rem", borderRadius: 12 }} />
          ))}
        </div>
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr 1fr" }}>
          <div className="skeleton" style={{ height: "20rem", borderRadius: 12 }} />
          <div className="skeleton" style={{ height: "20rem", borderRadius: 12 }} />
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

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};

  const projectChartData = (charts.projectStatus || []).map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " "),
    value: item.count,
    color: PROJECT_STATUS_COLORS[item.status] || "#3b82f6",
  }));

  const taskChartData = (charts.taskStatus || []).map((item) => ({
    name: item.status === "in_progress" ? "In Progress" : item.status === "in_review" ? "In Review" : item.status === "completed" || item.status === "done" ? "Done" : "To Do",
    count: item.count,
    color: TASK_STATUS_COLORS[item.status] || "#3b82f6",
  }));

  return (
    <section className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: "1.65rem" }}>
            Dashboard
          </h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.875rem" }}>
            Welcome back, {user?.name?.split(" ")[0]}. Here is what is happening across your workspaces.
          </p>
        </div>

        <button type="button" onClick={loadData} className="btn btn-secondary btn-sm">
          Refresh
        </button>
      </div>

      {/* 4 Primary KPI Cards */}
      <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13.5rem), 1fr))", marginBottom: "1.75rem" }}>
        <StatCard
          label="Active Projects"
          value={metrics.totalProjects ?? 0}
          sub="Organization workspaces"
          accentColor="#3b82f6"
        />
        <StatCard
          label="Total Tasks"
          value={metrics.totalTasks ?? 0}
          sub={`${metrics.completedTasks ?? 0} completed`}
          accentColor="#10b981"
        />
        <StatCard
          label="Team Members"
          value={metrics.activeUsers ?? 0}
          sub={`${metrics.totalUsers ?? 0} registered accounts`}
          accentColor="#7c52e8"
        />
        <StatCard
          label="Delivery Rate"
          value={`${metrics.completionRate ?? 0}%`}
          sub="Platform throughput"
          accentColor="#d97c10"
        />
      </div>

      {/* Visual Analytics Charts Grid */}
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))" }}>
        {/* Project Status Donut Chart */}
        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 className="section-title" style={{ margin: 0 }}>Project Status</h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>
              Distribution by project lifecycle
            </p>
          </div>

          {projectChartData.length === 0 ? (
            <div style={{ height: "15rem", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: "0.875rem" }}>
              No projects created yet.
            </div>
          ) : (
            <div style={{ height: "15rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {projectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      color: "var(--ink)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center", marginTop: "0.5rem" }}>
            {projectChartData.map((item) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>{item.name}</span>
                <span style={{ color: "var(--muted)" }}>({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Velocity Bar Chart */}
        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 className="section-title" style={{ margin: 0 }}>Task Pipeline</h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>
              Current volume across work stages
            </p>
          </div>

          {taskChartData.length === 0 ? (
            <div style={{ height: "15rem", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: "0.875rem" }}>
              No tasks created yet.
            </div>
          ) : (
            <div style={{ height: "15rem", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      color: "var(--ink)",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {taskChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", padding: "0.6rem 0.85rem", background: "var(--surface2)", borderRadius: "8px", fontSize: "0.775rem" }}>
            <span style={{ color: "var(--muted)" }}>Overall Delivery:</span>
            <span style={{ fontWeight: 700, color: "var(--green)" }}>{metrics.completionRate ?? 0}% Finished</span>
          </div>
        </div>
      </div>
    </section>
  );
}
