import { useEffect, useState, useMemo } from "react";
import { getDashboard, listProjects, listProjectTasks, getErrorMessage } from "../lib/api.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import Toast from "../components/Toast.jsx";

const COLORS = ["#8b95ab", "#4f6ef7", "#d97c10", "#10b981", "#ef4444"];

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects]           = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectTasks, setProjectTasks]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError]                 = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      getDashboard(),
      listProjects({ limit: 50 }).catch(() => ({ data: { items: [] } })),
    ])
      .then(([dashRes, projRes]) => {
        setDashboardData(dashRes.data);
        setProjects(projRes.data.items || []);
      })
      .catch(err => setError(getErrorMessage(err, "Failed to load analytics.")))
      .finally(() => setLoading(false));
  }, []);

  // When project filter changes
  useEffect(() => {
    if (!selectedProject) {
      setProjectTasks(null);
      return;
    }
    setFilterLoading(true);
    listProjectTasks(selectedProject, { limit: 100 })
      .then(res => setProjectTasks(res.data.items || []))
      .catch(() => setProjectTasks([]))
      .finally(() => setFilterLoading(false));
  }, [selectedProject]);

  // Derive metrics based on selected project or global dashboard
  const { metrics, barData, pieData } = useMemo(() => {
    if (selectedProject && projectTasks !== null) {
      const total = projectTasks.length;
      const completed = projectTasks.filter(t => t.status === "completed" || t.status === "done").length;
      const inProgress = projectTasks.filter(t => t.status === "in_progress").length;
      const inReview = projectTasks.filter(t => t.status === "in_review").length;
      const todo = projectTasks.filter(t => t.status === "todo").length;

      const now = new Date();
      const overdue = projectTasks.filter(t => {
        if (!t.dueDate || t.status === "completed" || t.status === "done") return false;
        return new Date(t.dueDate) < now;
      }).length;

      const bData = [
        { name: "To Do", count: todo },
        { name: "In Progress", count: inProgress },
        { name: "In Review", count: inReview },
        { name: "Done", count: completed },
      ];

      const pData = [
        { name: "Completed", value: completed },
        { name: "In Progress", value: inProgress },
        { name: "To Do", value: todo },
        { name: "Overdue", value: overdue },
      ].filter(d => d.value > 0);

      return {
        metrics: {
          totalProjects: 1,
          totalTasks: total,
          completed,
          inProgress,
          overdue,
        },
        barData: bData,
        pieData: pData.length > 0 ? pData : [{ name: "No tasks", value: 1 }],
      };
    }

    const m = dashboardData?.metrics || {};
    const ts = dashboardData?.taskStatus || [];

    const bData = ts.map(t => ({
      name: t.status === "in_progress" ? "In Progress" : t.status === "in_review" ? "In Review" : t.status === "completed" || t.status === "done" ? "Done" : "To Do",
      count: t.count,
    }));

    const pData = [
      { name: "Completed", value: m.completed || 0 },
      { name: "In Progress", value: m.inProgress || 0 },
      { name: "Overdue", value: m.overdue || 0 },
      { name: "Upcoming", value: m.upcoming || 0 },
    ].filter(d => d.value > 0);

    return {
      metrics: {
        totalProjects: m.totalProjects || 0,
        totalTasks: m.totalTasks || 0,
        completed: m.completed || 0,
        inProgress: m.inProgress || 0,
        overdue: m.overdue || 0,
      },
      barData: bData.length > 0 ? bData : [{ name: "To Do", count: 0 }, { name: "In Progress", count: 0 }, { name: "Done", count: 0 }],
      pieData: pData.length > 0 ? pData : [{ name: "No data", value: 1 }],
    };
  }, [dashboardData, selectedProject, projectTasks]);

  if (loading) {
    return (
      <section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="skeleton" style={{ height: "18rem", borderRadius: "12px" }} />
          <div className="skeleton" style={{ height: "18rem", borderRadius: "12px" }} />
        </div>
      </section>
    );
  }

  return (
    <section className="fade-in">
      <Toast message={error} type="error" onClose={() => setError("")} />

      {/* Header and Project Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        <div>
          <h1 className="page-title">Analytics & Velocity</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            Real-time metrics, throughput, and status distribution across accessible projects.
          </p>
        </div>

        {/* Project Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label htmlFor="analytics-proj-select" style={{ fontSize: "0.825rem", color: "var(--muted)", fontWeight: 600 }}>
            Filter by Project:
          </label>
          <select
            id="analytics-proj-select"
            className="input"
            style={{ width: "auto", minWidth: "14rem" }}
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            <option value="">All Projects (Workspace Overview)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filterLoading && (
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>
          Updating metrics for selected project…
        </p>
      )}

      {/* Top metrics summary */}
      <div className="analytics-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Total Projects / Filter info */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {selectedProject ? "Selected Scope" : "Total Projects"}
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)" }}>
            {metrics.totalProjects || 0}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: "0.25rem" }}>
            {selectedProject ? "Individual project view" : "Active workspace roadmaps"}
          </span>
        </div>

        {/* Total Tasks */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Total Tasks
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.75rem", fontWeight: 800, color: "var(--accent)" }}>
            {metrics.totalTasks || 0}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: "0.25rem" }}>
            All sprint items & deliverables
          </span>
        </div>

        {/* Completed */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Completed Tasks
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.75rem", fontWeight: 800, color: "var(--green)" }}>
            {metrics.completed || 0}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: "0.25rem" }}>
            Successfully closed items
          </span>
        </div>

        {/* Overdue card (Clean, understandable, helpful) */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Overdue Tasks
            </p>
            <span style={{ fontSize: "0.7rem", background: "rgba(239, 68, 68, 0.12)", color: "#ef4444", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
              Action needed
            </span>
          </div>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.75rem", fontWeight: 800, color: "var(--red)" }}>
            {metrics.overdue || 0}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: "0.25rem" }}>
            Tasks past their scheduled deadline
          </span>
        </div>
      </div>

      {/* Visual Recharts Charts */}
      <div className="analytics-chart-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 26rem), 1fr))", gap: "1.25rem" }}>
        {/* Status Bar Chart */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "var(--ink)" }}>
            Tasks by Status
          </h2>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.8rem" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "var(--ink)" }}>
            Workload Distribution
          </h2>
          <div style={{ width: "100%", height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.8rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
