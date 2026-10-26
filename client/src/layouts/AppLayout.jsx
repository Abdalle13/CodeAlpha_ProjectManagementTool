import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import BrandMark from "../components/BrandMark.jsx";

// Regular Member Workspace Navigation
const WORKSPACE_NAV = [
  { to: "/",          label: "Home",        end: true,  icon: IconHome },
  { to: "/projects",  label: "Projects",    end: false, icon: IconProjects },
  { to: "/tasks",     label: "Tasks",       end: false, icon: IconTasks },
  { to: "/members",   label: "Members",     end: false, icon: IconTeam },
  { to: "/analytics", label: "Analytics",   end: false, icon: IconAnalytics },
  { to: "/activity",  label: "Activity",    end: false, icon: IconActivity },
];

// System Administrator Navigation
const ADMIN_NAV = [
  { to: "/admin",          label: "Dashboard",         end: true,  icon: IconOverview },
  { to: "/admin/users",    label: "Users",             end: false, icon: IconUsers },
  { to: "/admin/projects", label: "Projects",          end: false, icon: IconProjects },
  { to: "/admin/roles",    label: "Roles & Permissions", end: false, icon: IconShield },
  { to: "/admin/reports",  label: "Reports",           end: false, icon: IconReports },
];

function IconHome()      { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconOverview()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>; }
function IconUsers()     { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconReports()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function IconProjects()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/></svg>; }
function IconTasks()     { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function IconTeam()      { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconAnalytics() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function IconActivity()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function IconSettings()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function IconShield()    { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconMenu()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function IconX()         { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconLogout()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

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
  const location         = useLocation();

  const isAdmin = user?.systemRole === "admin";
  const currentNav = isAdmin ? ADMIN_NAV : WORKSPACE_NAV;

  // Determine current page title
  let breadcrumbTitle = "Dashboard";
  if (isAdmin) {
    if (location.pathname === "/admin") breadcrumbTitle = "Dashboard";
    else if (location.pathname.startsWith("/admin/users")) breadcrumbTitle = "Users";
    else if (location.pathname.startsWith("/admin/projects")) breadcrumbTitle = "Projects";
    else if (location.pathname.startsWith("/admin/roles")) breadcrumbTitle = "Roles & Permissions";
    else if (location.pathname.startsWith("/admin/reports")) breadcrumbTitle = "Reports";
    else if (location.pathname.startsWith("/profile")) breadcrumbTitle = "Settings";
  } else {
    if (location.pathname === "/") breadcrumbTitle = "Home";
    else if (location.pathname.startsWith("/projects")) breadcrumbTitle = "Projects";
    else if (location.pathname.startsWith("/tasks")) breadcrumbTitle = "Tasks";
    else if (location.pathname.startsWith("/members") || location.pathname.startsWith("/team")) breadcrumbTitle = "Members";
    else if (location.pathname.startsWith("/analytics")) breadcrumbTitle = "Analytics";
    else if (location.pathname.startsWith("/activity")) breadcrumbTitle = "Activity";
    else if (location.pathname.startsWith("/profile")) breadcrumbTitle = "Settings";
  }

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
          width: "var(--sidebar-w, 15.5rem)",
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
          zIndex: 40,
        }}
        className={open ? "" : "max-lg-hidden"}
      >
        {/* Brand Header */}
        <div style={{ padding: "1.125rem 1rem 0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
          <BrandMark compact />
          <button
            type="button"
            className="btn btn-ghost btn-sm lg-hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            style={{ padding: "0.25rem", color: "var(--muted)" }}
          >
            <IconX />
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: "0.75rem 0.625rem", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }} aria-label="Main navigation">
          {currentNav.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              onClick={() => setOpen(false)}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Navigation Section: Settings pinned above profile */}
        <div style={{ padding: "0.5rem 0.625rem 0.25rem", borderTop: "1px solid var(--border)" }}>
          <NavLink
            to="/profile"
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            onClick={() => setOpen(false)}
          >
            <IconSettings />
            Settings
          </NavLink>
        </div>

        {/* User Profile Footer */}
        <div style={{ padding: "0.75rem 0.875rem 1rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
            <Avatar name={user?.name} size={32} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: "var(--ink)" }}>
                {user?.name}
              </p>
              <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                {isAdmin ? "Administrator" : "Member"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-danger btn-sm"
            style={{ justifyContent: "center", gap: "0.5rem", width: "100%" }}
          >
            <IconLogout /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 45, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", border: "none", cursor: "default" }}
        />
      )}

      {/* ── Main View Container ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* ── Clean Top Navbar ── */}
        <header
          style={{
            height: "var(--header-h, 3.25rem)",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1.5rem",
            position: "sticky",
            top: 0,
            zIndex: 20,
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Left: Mobile Toggle & Page Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm lg-hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="sidebar"
              onClick={() => setOpen(v => !v)}
            >
              {open ? <IconX /> : <IconMenu />}
            </button>

            <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--ink)" }}>
              {breadcrumbTitle}
            </span>
          </div>

          {/* Right: Theme Toggle & Avatar with user name */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ThemeToggle />

            <Link
              to="/profile"
              title="Settings"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                textDecoration: "none",
                padding: "0.25rem 0.65rem 0.25rem 0.35rem",
                borderRadius: "8px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
              }}
            >
              <Avatar name={user?.name} size={24} />
              <span className="header-user-name" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", maxWidth: "8.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name}
              </span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflow: "auto", padding: "1.75rem 1.75rem 3rem" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
