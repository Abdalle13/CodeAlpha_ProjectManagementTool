import { useEffect, useState } from "react";
import { getDashboard, getErrorMessage } from "../lib/api.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import Toast from "../components/Toast.jsx";

const COLORS = ["#8b95ab", "#4f6ef7", "#d97c10", "#17a55e"];

export default function AnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  function fetchData() {
    setLoading(true);
    setError("");
    getDashboard()
      .then(res => setData(res.data))
      .catch(err => setError(getErrorMessage(err, "Failed to load analytics.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, []);

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

  const { metrics, taskStatus } = data || { metrics: {}, taskStatus: [] };

  const barData = (taskStatus || []).map(ts => ({
    name: ts.status === "in_progress" ? "In Progress" : ts.status === "in_review" ? "In Review" : ts.status === "completed" || ts.status === "done" ? "Done" : "To Do",
    count: ts.count,
  }));

  const pieData = [
    { name: "Completed", value: metrics.completed || 0 },
    { name: "In Progress", value: metrics.inProgress || 0 },
    { name: "Overdue", value: metrics.overdue || 0 },
    { name: "Upcoming", value: metrics.upcoming || 0 },
  ];

  return (
    <section className="fade-in">
      <Toast message={error} type="error" onClose={() => setError("")} />
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 className="page-title">Analytics & Velocity</h1>
        <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
          Real-time metrics, throughput, and status distribution across accessible projects.
        </p>
      </div>

      {/* Top metrics summary */}
      <div className="analytics-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Total Projects</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)" }}>{metrics.totalProjects || 0}</p>
        </div>
        <div className="card" style={{ padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Total Tasks</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.75rem", fontWeight: 800, color: "var(--accent)" }}>{metrics.totalTasks || 0}</p>
        </div>
        <div className="card" style={{ padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Completed</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.75rem", fontWeight: 800, color: "var(--green)" }}>{metrics.completed || 0}</p>
        </div>
        <div className="card" style={{ padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Overdue</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.75rem", fontWeight: 800, color: "var(--red)" }}>{metrics.overdue || 0}</p>
        </div>
      </div>

      {/* Visual Recharts Charts */}
      <div className="analytics-chart-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
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

        {/* Priority Pie Chart */}
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
