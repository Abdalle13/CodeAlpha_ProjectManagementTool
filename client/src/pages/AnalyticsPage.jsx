import { useEffect, useState, useMemo } from "react";
import { getDashboard, listProjects, listProjectTasks, getErrorMessage } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import Toast from "../components/Toast.jsx";

const COLORS = ["#4f6ef7", "#10b981", "#f59e0b", "#8b5cf6", "#64748b", "#ef4444"];

/* ─── Vector Icons (Pure SVG) ────────────────────────────────────── */
const IcoDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IcoFileText = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectTasks, setProjectTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      getDashboard(),
      listProjects({ limit: 100 }).catch(() => ({ data: { items: [] } })),
    ])
      .then(([dashRes, projRes]) => {
        setDashboardData(dashRes.data);
        setProjects(projRes.data.items || []);
      })
      .catch((err) => setError(getErrorMessage(err, "Failed to load analytics and reports.")))
      .finally(() => setLoading(false));
  }, []);

  // When project filter changes
  useEffect(() => {
    if (!selectedProject) {
      setProjectTasks(null);
      return;
    }
    setFilterLoading(true);
    listProjectTasks(selectedProject, { limit: 200 })
      .then((res) => setProjectTasks(res.data.items || []))
      .catch(() => setProjectTasks([]))
      .finally(() => setFilterLoading(false));
  }, [selectedProject]);

  // Derive metrics based on selected project or global dashboard
  const { metrics, barData, pieData, completionRate, tableRows } = useMemo(() => {
    if (selectedProject && projectTasks !== null) {
      const activeProj = projects.find((p) => p.id === selectedProject);
      const projName = activeProj?.name || "Selected Project";
      const total = projectTasks.length;
      const completed = projectTasks.filter((t) => t.status === "completed" || t.status === "done").length;
      const inProgress = projectTasks.filter((t) => t.status === "in_progress").length;
      const inReview = projectTasks.filter((t) => t.status === "in_review").length;
      const todo = projectTasks.filter((t) => t.status === "todo").length;

      const now = new Date();
      const overdue = projectTasks.filter((t) => {
        if (!t.dueDate || t.status === "completed" || t.status === "done") return false;
        return new Date(t.dueDate) < now;
      }).length;

      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const bData = [
        { name: "To Do", count: todo },
        { name: "In Progress", count: inProgress },
        { name: "In Review", count: inReview },
        { name: "Done", count: completed },
      ];

      const pData = [
        { name: "Completed", value: completed },
        { name: "In Progress", value: inProgress },
        { name: "In Review", value: inReview },
        { name: "To Do", value: todo },
      ].filter((d) => d.value > 0);

      const rows = [
        {
          name: projName,
          status: activeProj?.status || "active",
          total,
          completed,
          progress: rate,
          overdue,
        },
      ];

      return {
        metrics: {
          totalProjects: 1,
          totalTasks: total,
          completed,
          inProgress,
          overdue,
          inReview,
        },
        barData: bData,
        pieData: pData.length > 0 ? pData : [{ name: "No tasks", value: 1 }],
        completionRate: rate,
        tableRows: rows,
      };
    }

    const m = dashboardData?.metrics || {};
    const ts = dashboardData?.taskStatus || [];
    const pp = dashboardData?.projectProgress || [];

    const total = m.totalTasks || 0;
    const completed = m.completed || 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const bData = [
      { name: "To Do", count: ts.find((x) => x.status === "todo")?.count || 0 },
      { name: "In Progress", count: ts.find((x) => x.status === "in_progress")?.count || 0 },
      { name: "In Review", count: ts.find((x) => x.status === "in_review")?.count || 0 },
      { name: "Done", count: ts.find((x) => x.status === "done" || x.status === "completed")?.count || completed },
    ];

    const pData = bData.map((d) => ({ name: d.name, value: d.count })).filter((x) => x.value > 0);

    const rows = pp.map((p) => ({
      name: p.name,
      status: "active",
      total: p.total,
      completed: p.completed,
      progress: p.progress,
      overdue: 0,
    }));

    return {
      metrics: {
        totalProjects: m.totalProjects || 0,
        totalTasks: total,
        completed,
        inProgress: m.inProgress || 0,
        overdue: m.overdue || 0,
        inReview: ts.find((x) => x.status === "in_review")?.count || 0,
      },
      barData: bData,
      pieData: pData.length > 0 ? pData : [{ name: "No data", value: 1 }],
      completionRate: rate,
      tableRows: rows,
    };
  }, [dashboardData, selectedProject, projectTasks, projects]);

  /* ─── Export CSV Report ────────────────────────────────────────── */
  function handleExportCSV() {
    const scopeLabel = selectedProject
      ? projects.find((p) => p.id === selectedProject)?.name || "Project"
      : "Full Workspace";

    const rows = [
      ["TASKORA WORKSPACE & PROJECT REPORT"],
      ["Generated On", new Date().toLocaleString()],
      ["Scope", scopeLabel],
      ["Generated By", user?.name || "User"],
      [],
      ["EXECUTIVE SUMMARY", "VALUE"],
      ["Total Projects", metrics.totalProjects],
      ["Total Deliverables/Tasks", metrics.totalTasks],
      ["Completed Tasks", metrics.completed],
      ["In Progress Tasks", metrics.inProgress],
      ["Overdue Tasks", metrics.overdue],
      ["Sprint Completion Rate", `${completionRate}%`],
      [],
      ["STAGE BREAKDOWN", "COUNT"],
      ...barData.map((b) => [b.name, b.count]),
      [],
      ["PROJECT DELIVERY STATUS", "COMPLETED", "TOTAL", "PROGRESS (%)"],
      ...tableRows.map((r) => [r.name, r.completed, r.total, `${r.progress}%`]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Taskora_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ msg: "CSV report exported successfully.", type: "success" });
  }

  /* ─── Download Full PDF Report (Print-to-PDF Engine) ───────────── */
  function handleDownloadPDF() {
    const scopeLabel = selectedProject
      ? projects.find((p) => p.id === selectedProject)?.name || "Project"
      : "Full Workspace Overview";

    const nowStr = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate the downloadable PDF report.");
      return;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Taskora Report - ${scopeLabel}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.5;
      font-size: 13px;
    }
    .header {
      border-bottom: 2px solid #4f6ef7;
      padding-bottom: 14px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
    }
    .brand span { color: #4f6ef7; }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 3px;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #64748b;
    }
    .meta-box strong { color: #0f172a; }
    h2 {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 24px 0 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-val {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    th {
      text-align: left;
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 8px 10px;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 700;
      background: #e2e8f0;
    }
    .badge-done { background: #dcfce7; color: #166534; }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Taskora <span>Reports</span></div>
      <div class="subtitle">Workspace Performance & Delivery Analytics</div>
    </div>
    <div class="meta-box">
      <div>Report Scope: <strong>${scopeLabel}</strong></div>
      <div>Generated: <strong>${nowStr}</strong></div>
      <div>Generated By: <strong>${user?.name || "Workspace Member"}</strong></div>
    </div>
  </div>

  <h2>1. Executive Summary</h2>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Active Projects</div>
      <div class="kpi-val">${metrics.totalProjects}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Deliverables</div>
      <div class="kpi-val">${metrics.totalTasks}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Completed Tasks</div>
      <div class="kpi-val" style="color: #16a34a;">${metrics.completed}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Completion Velocity</div>
      <div class="kpi-val" style="color: #4f6ef7;">${completionRate}%</div>
    </div>
  </div>

  <h2>2. Workflow Stage Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Workflow Stage</th>
        <th>Task Count</th>
        <th>Share of Workload</th>
      </tr>
    </thead>
    <tbody>
      ${barData
        .map((b) => {
          const total = metrics.totalTasks || 1;
          const pct = Math.round((b.count / total) * 100);
          return `<tr>
          <td><strong>${b.name}</strong></td>
          <td>${b.count} tasks</td>
          <td>${pct}%</td>
        </tr>`;
        })
        .join("")}
    </tbody>
  </table>

  <h2>3. Project Delivery Status</h2>
  <table>
    <thead>
      <tr>
        <th>Project Name</th>
        <th>Delivered</th>
        <th>Total Tasks</th>
        <th>Completion Rate</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows
        .map(
          (r) => `<tr>
        <td><strong>${r.name}</strong></td>
        <td>${r.completed}</td>
        <td>${r.total}</td>
        <td><span class="badge ${r.progress === 100 ? "badge-done" : ""}">${r.progress}%</span></td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <span>Confidential — Internal Taskora Workspace Report</span>
    <span>Page 1 of 1</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setToast({ msg: "PDF printable report generated. Choose 'Save as PDF' to download.", type: "success" });
  }

  if (loading) {
    return (
      <section className="fade-in">
        <div style={{ height: "4.5rem", borderRadius: "12px", marginBottom: "1.5rem" }} className="skeleton" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "7rem", borderRadius: "12px" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="skeleton" style={{ height: "18rem", borderRadius: "12px" }} />
          <div className="skeleton" style={{ height: "18rem", borderRadius: "12px" }} />
        </div>
      </section>
    );
  }

  return (
    <section className="fade-in" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "3rem" }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <Toast message={error} type="error" onClose={() => setError("")} />

      {/* ─── Top Header & Report Actions ────────────────────────────────── */}
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
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Analytics & Reports
          </h1>
          <p style={{ marginTop: "0.25rem", color: "var(--muted)", fontSize: "0.84rem" }}>
            Real-time throughput, status distributions, and downloadable executive reports.
          </p>
        </div>

        {/* Filter and Download Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Project Filter */}
          <select
            id="analytics-proj-select"
            className="input"
            style={{ width: "auto", minWidth: "13rem", height: "2.25rem", fontSize: "0.825rem" }}
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">All Projects (Workspace Overview)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ gap: "0.45rem", fontSize: "0.825rem" }}
            title="Download CSV raw data"
          >
            <IcoFileText />
            <span>Export CSV</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="btn btn-primary"
            style={{ gap: "0.45rem", fontSize: "0.825rem" }}
            title="Download full printable PDF report"
          >
            <IcoDownload />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {filterLoading && (
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>
          Updating analytics for selected scope…
        </p>
      )}

      {/* ─── Top KPI Matrix ─────────────────────────────────────────────── */}
      <div
        className="analytics-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Total Projects / Scope */}
        <div className="card" style={{ padding: "1.25rem", borderRadius: "14px" }}>
          <p style={{ margin: 0, fontSize: "0.725rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {selectedProject ? "Selected Scope" : "Active Projects"}
          </p>
          <p style={{ margin: "0.4rem 0 0", fontSize: "1.85rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
            {metrics.totalProjects || 0}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: "0.35rem" }}>
            {selectedProject ? "Individual project report" : "Workspaces currently active"}
          </span>
        </div>

        {/* Total Tasks */}
        <div className="card" style={{ padding: "1.25rem", borderRadius: "14px" }}>
          <p style={{ margin: 0, fontSize: "0.725rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total Deliverables
          </p>
          <p style={{ margin: "0.4rem 0 0", fontSize: "1.85rem", fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
            {metrics.totalTasks || 0}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: "0.35rem" }}>
            Total tracked sprint work items
          </span>
        </div>

        {/* Completed Tasks & Rate */}
        <div className="card" style={{ padding: "1.25rem", borderRadius: "14px" }}>
          <p style={{ margin: 0, fontSize: "0.725rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Completed Tasks
          </p>
          <p style={{ margin: "0.4rem 0 0", fontSize: "1.85rem", fontWeight: 800, color: "var(--green)", lineHeight: 1 }}>
            {metrics.completed || 0}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: "0.35rem" }}>
            {completionRate}% overall completion velocity
          </span>
        </div>

        {/* Overdue Tasks */}
        <div className="card" style={{ padding: "1.25rem", borderRadius: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "0.725rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Overdue Tasks
            </p>
            {metrics.overdue > 0 && (
              <span style={{ fontSize: "0.68rem", background: "var(--red-soft)", color: "var(--red)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                Attention
              </span>
            )}
          </div>
          <p style={{ margin: "0.4rem 0 0", fontSize: "1.85rem", fontWeight: 800, color: metrics.overdue > 0 ? "var(--red)" : "var(--ink)", lineHeight: 1 }}>
            {metrics.overdue || 0}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: "0.35rem" }}>
            Tasks past their scheduled deadline
          </span>
        </div>
      </div>

      {/* ─── Visual Recharts Section ────────────────────────────────────── */}
      <div
        className="analytics-chart-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 24rem), 1fr))",
          gap: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Status Bar Chart */}
        <div className="card" style={{ padding: "1.5rem", borderRadius: "16px" }}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>
              Tasks by Workflow Stage
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>
              Distribution across To Do, In Progress, In Review, and Done
            </p>
          </div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--ink)",
                    fontSize: "0.8rem",
                    boxShadow: "var(--shadow)",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="card" style={{ padding: "1.5rem", borderRadius: "16px" }}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>
              Workload Share Distribution
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>
              Proportion of active vs completed work
            </p>
          </div>
          <div style={{ width: "100%", height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`pie-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--ink)",
                    fontSize: "0.8rem",
                    boxShadow: "var(--shadow)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Detailed Project Delivery Breakdown Table ──────────────────── */}
      <div className="card" style={{ borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>
              Delivery Breakdown
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "var(--muted)" }}>
              Completion metrics and task pacing
            </p>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>
            {tableRows.length} {tableRows.length === 1 ? "project" : "projects"} listed
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "0.75rem 1.25rem", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Project</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Delivered</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Total Tasks</th>
                <th style={{ padding: "0.75rem 1.25rem", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                    No project delivery data available.
                  </td>
                </tr>
              ) : (
                tableRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "var(--ink)" }}>
                      {r.name}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "var(--green)", fontWeight: 600 }}>
                      {r.completed}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "var(--ink2)" }}>
                      {r.total}
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ flex: 1, maxWidth: "8rem", height: "6px", background: "var(--surface2)", borderRadius: "99px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${r.progress}%`,
                              height: "100%",
                              background: r.progress === 100 ? "var(--green)" : "var(--accent)",
                              borderRadius: "99px",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: r.progress === 100 ? "var(--green)" : "var(--accent)" }}>
                          {r.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
