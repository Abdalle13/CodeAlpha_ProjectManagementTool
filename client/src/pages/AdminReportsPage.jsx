import { useEffect, useState } from "react";
import { getAdminStats, getErrorMessage } from "../lib/api.js";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#64748b"];

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", top: "1.25rem", right: "1.5rem", zIndex: 9999,
      display: "flex", alignItems: "center", gap: "0.6rem",
      background: type === "success" ? "var(--green)" : "var(--red)",
      color: "#fff", borderRadius: "10px",
      padding: "0.75rem 1.1rem", fontSize: "0.875rem", fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      animation: "slide-up 200ms ease", maxWidth: "28rem",
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, opacity: 0.8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <p style={{ margin: "0.35rem 0 0.15rem", fontSize: "2rem", fontWeight: 800, color: color || "var(--ink)", lineHeight: 1.1 }}>
        {value}
      </p>
      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{sub}</span>
    </div>
  );
}

export default function AdminReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [chartType, setChartType] = useState("tasks");

  useEffect(() => {
    let active = true;
    getAdminStats()
      .then(res => { if (active) setData(res.data); })
      .catch(err => { if (active) setToast({ msg: getErrorMessage(err, "Failed to generate reports."), type: "error" }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function handleExportCSV() {
    if (!data) return;
    const { metrics, charts } = data;
    const rows = [
      ["Metric", "Value"],
      ["Total Projects", metrics.totalProjects || 0],
      ["Total Tasks", metrics.totalTasks || 0],
      ["Completed Tasks", metrics.completedTasks || 0],
      ["Completion Rate (%)", `${metrics.completionRate || 0}%`],
      ["Total Users", metrics.totalUsers || 0],
      ["Active Users", metrics.activeUsers || 0],
      [],
      ["Project Status", "Count"],
      ...(charts?.projectStatus || []).map(p => [p.status, p.count]),
      [],
      ["Task Status", "Count"],
      ...(charts?.taskStatus || []).map(t => [t.status, t.count]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Platform_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ msg: "CSV exported successfully.", type: "success" });
  }

  if (loading) {
    return (
      <section className="fade-in">
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", marginBottom: "1.5rem" }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: "7rem", borderRadius: 12 }} />)}
        </div>
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr 1fr" }}>
          <div className="skeleton" style={{ height: "18rem", borderRadius: 12 }} />
          <div className="skeleton" style={{ height: "18rem", borderRadius: 12 }} />
        </div>
      </section>
    );
  }

  const { metrics = {}, charts = {} } = data || {};

  const taskData = (charts.taskStatus || []).map(t => ({
    name: t.status === "in_progress" ? "In Progress" : t.status === "in_review" ? "In Review" : (t.status === "completed" || t.status === "done") ? "Done" : "To Do",
    count: t.count,
  }));

  const projectData = (charts.projectStatus || []).map(p => ({
    name: p.status.charAt(0).toUpperCase() + p.status.slice(1).replace("_", " "),
    value: p.count,
  }));

  const priorityData = (charts.taskPriority || []).map(p => ({
    name: p.priority ? p.priority.charAt(0).toUpperCase() + p.priority.slice(1) : "None",
    count: p.count,
  }));

  const PRIORITY_COLORS = { High: "#d83a38", Medium: "#d97c10", Low: "#17a55e", None: "#64748b" };

  return (
    <section className="fade-in">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Reports</h1>
          <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.875rem" }}>
            Platform productivity, delivery throughput, and project status breakdowns.
          </p>
        </div>
        <button type="button" onClick={handleExportCSV} className="btn btn-secondary btn-sm" style={{ gap: "0.45rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", marginBottom: "1.75rem" }}>
        <KpiCard label="Completion Rate" value={`${metrics.completionRate ?? 0}%`} sub="Platform average" color="var(--green)" />
        <KpiCard label="Delivered Tasks" value={metrics.completedTasks ?? 0} sub={`Out of ${metrics.totalTasks ?? 0} total`} />
        <KpiCard label="Total Projects" value={metrics.totalProjects ?? 0} sub="Active & completed" />
        <KpiCard label="Active Team" value={metrics.activeUsers ?? 0} sub={`of ${metrics.totalUsers ?? 0} registered`} color="var(--accent)" />
      </div>

      {/* Chart Toggle */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem" }}>
        {[["tasks", "Task Pipeline"], ["projects", "Project Breakdown"], ["priority", "Task Priority"]].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={"btn btn-sm " + (chartType === key ? "btn-primary" : "btn-secondary")}
            onClick={() => setChartType(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))", marginBottom: "1.75rem" }}>
        {/* Bar Chart */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 className="section-title" style={{ margin: "0 0 0.25rem" }}>
            {chartType === "tasks" ? "Task Pipeline" : chartType === "priority" ? "Priority Distribution" : "Project Status"}
          </h2>
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.775rem", color: "var(--muted)" }}>
            Volume across {chartType === "tasks" ? "work stages" : chartType === "priority" ? "priority levels" : "phases"}
          </p>
          <div style={{ height: "15rem", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartType === "tasks" ? taskData : chartType === "priority" ? priorityData : projectData.map(d => ({ name: d.name, count: d.value }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.8rem", color: "var(--ink)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(chartType === "tasks" ? taskData : chartType === "priority" ? priorityData : projectData.map(d => ({ name: d.name, count: d.value }))).map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={
                      chartType === "priority" ? (PRIORITY_COLORS[entry.name] || COLORS[index % COLORS.length]) : COLORS[index % COLORS.length]
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - always project data */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 className="section-title" style={{ margin: "0 0 0.25rem" }}>Project Pipeline</h2>
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.775rem", color: "var(--muted)" }}>
            Distribution of projects across phases
          </p>
          {projectData.length === 0 ? (
            <div style={{ height: "15rem", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: "0.875rem" }}>No projects yet.</div>
          ) : (
            <>
              <div style={{ height: "13rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projectData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={4} dataKey="value">
                      {projectData.map((_, index) => <Cell key={`cell-p-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.8rem", color: "var(--ink)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", justifyContent: "center", marginTop: "0.5rem" }}>
                {projectData.map((item, idx) => (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[idx % COLORS.length] }} />
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: "var(--muted)" }}>({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detailed Distribution Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <h2 className="section-title" style={{ margin: 0 }}>Workload Distribution</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Stage</th>
                <th>Count</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {(charts.taskStatus || []).map(t => {
                const total = metrics.totalTasks || 1;
                const pct = Math.round((t.count / total) * 100);
                return (
                  <tr key={t.status}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>Tasks</td>
                    <td style={{ textTransform: "capitalize", color: "var(--ink2)" }}>{t.status.replace("_", " ")}</td>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{t.count}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ flex: 1, maxWidth: "7rem", height: "6px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: "99px" }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", minWidth: "2.5rem" }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(charts.projectStatus || []).map(p => {
                const total = metrics.totalProjects || 1;
                const pct = Math.round((p.count / total) * 100);
                return (
                  <tr key={`p-${p.status}`}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>Projects</td>
                    <td style={{ textTransform: "capitalize", color: "var(--ink2)" }}>{p.status.replace("_", " ")}</td>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{p.count}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ flex: 1, maxWidth: "7rem", height: "6px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "var(--purple)", borderRadius: "99px" }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", minWidth: "2.5rem" }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
