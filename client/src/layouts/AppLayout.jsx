import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

const NAV = [
  { to: "/",         label: "Dashboard",  end: true,  icon: IconDash },
  { to: "/projects", label: "Projects",   end: false, icon: IconProjects },
  { to: "/tasks",    label: "Tasks",      end: false, icon: IconTasks },
  { to: "/profile",  label: "Profile",    end: false, icon: IconProfile },
];

function IconDash()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function IconProjects() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/></svg>; }
function IconTasks()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function IconProfile()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function IconAdmin()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>; }
function IconMenu()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function IconX()        { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconLogout()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

function Avatar({ name, size = 32 }) {
  const initials = (name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#4f6ef7","#7c52e8","#17a55e","#d97c10","#d83a38"];
  const color  = colors[(name || "").charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, background: color, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0, letterSpacing: "0.02em" }}>
      {initials}
    </div>
  );
}

export { Avatar };

export default function AppLayout() {
  const [open, setOpen]  = useState(false);
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const isAdmin          = user?.systemRole === "admin";

  const nav = isAdmin ? [...NAV, { to: "/admin", label: "Admin", end: false, icon: IconAdmin }] : NAV;

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* ── Sidebar ── */}
      <aside
        id="sidebar"
        style={{
          width: "var(--sidebar-w, 15rem)",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100dvh",
          overflow: "hidden",
          transition: "transform 180ms ease",
        }}
        className={open ? "" : "max-lg-hidden"}
      >
        {/* Brand */}
        <div style={{ padding: "1.125rem 1rem 0.75rem", display: "flex", alignItems: "center", gap: "0.6rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 28, height: 28, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "-0.02em", color: "var(--ink)" }}>Taskora</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem 0.625rem", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }} aria-label="Main navigation">
          {nav.map(({ to, label, end, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} onClick={() => setOpen(false)}>
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "0.75rem 0.875rem 1rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
            <Avatar name={user?.name} size={30} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: "var(--ink)" }}>{user?.name}</p>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{user?.systemRole === "admin" ? "Administrator" : "Member"}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start", gap: "0.5rem", width: "100%" }}>
            <IconLogout /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {open && (
        <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 29, background: "rgba(0,0,0,0.4)", border: "none", cursor: "default" }}
        />
      )}

      {/* ── Main ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{ height: "var(--header-h, 3.25rem)", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0 1.25rem", position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(8px)" }}>
          <button type="button" className="btn btn-ghost btn-sm lg-hidden" aria-label="Toggle menu" aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(v => !v)}>
            {open ? <IconX /> : <IconMenu />}
          </button>
          <div style={{ flex: 1 }} />
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: "auto", padding: "1.75rem 1.5rem" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
