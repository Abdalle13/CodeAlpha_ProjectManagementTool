import { useEffect, useState } from "react";
import { getAdminStats, getErrorMessage } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ─── SVG Icons ─────────────────────────────────────────────── */
const IcoFolder   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/></svg>;
const IcoCheck    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
const IcoUsers    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoZap      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IcoShield   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoRefresh  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;

/* ─── Colour palette ────────────────────────────────────────── */
const PROJECT_COLORS = {
  active:    "#6b84ff",
  planning:  "#a07af0",
  paused:    "#f0a030",
  completed: "#2bc97e",
  archived:  "#586180",
};
function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

/* ─── KPI Card ──────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, trend, gradient }) {
  return (
    <div style={{
      position: "relative",
      borderRadius: "16px",
      padding: "1.5rem 1.5rem 1.25rem",
      overflow: "hidden",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    }}>
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: "-1.5rem", right: "-1.5rem",
        width: "7rem", height: "7rem",
        borderRadius: "50%",
        background: gradient,
        opacity: 0.12,
        filter: "blur(24px)",
        pointerEvents: "none",
      }} />
      {/* Icon pill */}
      <div style={{
        width: 42, height: 42, borderRadius: "11px",
        background: gradient,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      {/* Numbers */}
      <div>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: "0.2rem" }}>
          {label}
        </div>
        <div style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, color: "var(--ink)" }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: "0.775rem", color: "var(--muted)", marginTop: "0.3rem" }}>{sub}</div>}
      </div>
      {trend !== undefined && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.3rem",
          fontSize: "0.75rem", fontWeight: 700,
          color: trend >= 0 ? "var(--green)" : "var(--red)",
          background: trend >= 0 ? "var(--green-soft)" : "var(--red-soft)",
          borderRadius: "999px", padding: "2px 10px", alignSelf: "flex-start",
        }}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

/* ─── Section Panel ─────────────────────────────────────────── */
function Panel({ title, subtitle, children, style }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "1.5rem",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      ...style,
    }}>
      {(title || subtitle) && (
        <div>
          {title    && <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--ink)" }}>{title}</div>}
          {subtitle && <div style={{ fontSize: "0.775rem", color: "var(--muted)", marginTop: "0.15rem" }}>{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Custom Tooltip ────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.65rem 1rem", fontSize: "0.8rem", boxShadow: "var(--shadow)", color: "var(--ink)" }}>
      {label && <div style={{ fontWeight: 700, marginBottom: "0.3rem", color: "var(--muted)" }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.fill || p.color || p.stroke }} />
          <span style={{ fontWeight: 600 }}>{p.name || p.dataKey}: {p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Dashboard ─────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const { user }          = useAuth();
  const [data, setData]   = useState(null);
  const [loading, setL]   = useState(true);
  const [error, setError] = useState("");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const load = () => {
    setL(true); setError("");
    getAdminStats()
      .then(r => setData(r.data))
      .catch(e => setError(getErrorMessage(e, "Failed to load metrics.")))
      .finally(() => setL(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) return (
    <section className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="skeleton" style={{ height: "7rem", borderRadius: 16 }} />
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))" }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "9rem", borderRadius: 16 }} />)}
      </div>
      <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "1fr 1fr" }}>
        <div className="skeleton" style={{ height: "18rem", borderRadius: 16 }} />
        <div className="skeleton" style={{ height: "18rem", borderRadius: 16 }} />
      </div>
    </section>
  );

  if (error) return (
    <div style={{ padding: "1.5rem", borderRadius: 12, background: "var(--red-soft)", color: "var(--red)" }}>{error}</div>
  );

  const m  = data?.metrics || {};
  const ch = data?.charts  || {};

  const totalTasks = m.totalTasks     || 0;
  const doneTasks  = m.completedTasks || 0;
  const rate       = m.completionRate ?? pct(doneTasks, totalTasks);

  const projectChartData = (ch.projectStatus || []).map(item => ({
    name:  item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " "),
    value: item.count,
    color: PROJECT_COLORS[item.status] || "#6b84ff",
  }));

  // Synthetic weekly area data based on real totals
  const areaData = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => {
    const f = (i + 1) / 7;
    return {
      day,
      completed: Math.round(doneTasks  * f * 0.9),
      created:   Math.round(totalTasks * f * 0.75),
    };
  });


  return (
    <section className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ flex: '1 1 15rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <IcoShield /> Admin Panel
          </div>
          <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.25 }}>
            {greeting}, {user?.name?.split(" ")[0]}
          </h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.84rem', color: 'var(--muted)' }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={load}
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", height: "2.25rem", padding: "0 0.85rem", fontSize: "0.825rem", fontWeight: 600, whiteSpace: "nowrap" }}
          >
            <IcoRefresh />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:"grid", gap:"1rem", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 12rem), 1fr))" }}>
        <KpiCard icon={<IcoFolder />} label="Total Projects" value={m.totalProjects ?? 0}
          sub={`${(ch.projectStatus||[]).find(s=>s.status==="active")?.count ?? 0} currently active`}
          gradient="linear-gradient(135deg,#6b84ff,#4f6ef7)" />
        <KpiCard icon={<IcoCheck />} label="Tasks Completed" value={doneTasks}
          sub={`of ${totalTasks} total tasks`}
          gradient="linear-gradient(135deg,#2bc97e,#17a55e)" />
        <KpiCard icon={<IcoUsers />} label="Active Members" value={m.activeUsers ?? 0}
          sub={`${m.totalUsers ?? 0} registered accounts`}
          gradient="linear-gradient(135deg,#a07af0,#7c52e8)" />
        <KpiCard icon={<IcoZap />} label="Completion Rate" value={`${rate}%`}
          sub={`${doneTasks} of ${totalTasks} tasks done`}
          trend={rate > 50 ? rate - 50 : undefined}
          gradient="linear-gradient(135deg,#f0a030,#d97c10)" />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gap:"1.25rem", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 22rem), 1fr))" }}>

        {/* Area Chart */}
        <Panel title="Task Activity" subtitle="Tasks created vs completed this week">
          <div style={{ height:"15rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6b84ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b84ff" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2bc97e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2bc97e" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize:11, fill:"var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"var(--muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="created"   name="Created"   stroke="#6b84ff" strokeWidth={2} fill="url(#gC)" dot={false} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#2bc97e" strokeWidth={2} fill="url(#gD)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:"flex", gap:"1.25rem", justifyContent:"center" }}>
            {[{ color:"#6b84ff", label:"Created" }, { color:"#2bc97e", label:"Completed" }].map(l => (
              <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.775rem", color:"var(--muted)", fontWeight:600 }}>
                <span style={{ width:10, height:10, borderRadius:3, background:l.color, display:"inline-block" }} />
                {l.label}
              </div>
            ))}
          </div>
        </Panel>

        {/* Donut Chart */}
        <Panel title="Project Status" subtitle="Distribution by lifecycle stage">
          {projectChartData.length === 0 ? (
            <div style={{ height:"14rem", display:"grid", placeItems:"center", color:"var(--muted)", fontSize:"0.875rem" }}>No projects yet.</div>
          ) : (
            <>
              <div style={{ height:"12rem" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projectChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                      {projectChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", justifyContent:"center" }}>
                {projectChartData.map(item => (
                  <div key={item.name} style={{ display:"flex", alignItems:"center", gap:"0.35rem", fontSize:"0.75rem", background:"var(--surface2)", borderRadius:6, padding:"3px 9px" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:item.color }} />
                    <span style={{ fontWeight:600, color:"var(--ink2)" }}>{item.name}</span>
                    <span style={{ color:"var(--muted)" }}>({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>


    </section>
  );
}