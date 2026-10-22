import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import BrandMark from "../components/BrandMark.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import ApiStatus from "../components/ApiStatus.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
  { to: "/tasks", label: "Tasks" },
  { to: "/profile", label: "Profile" },
];

function navClass({ isActive }) {
  return [
    "block rounded-xl px-3 py-2 text-[0.98rem] font-medium",
    isActive ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--ink)] hover:bg-[var(--surface-muted)]",
  ].join(" ");
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const visibleLinks = user?.systemRole === "admin"
    ? [...links, { to: "/admin", label: "Administration" }]
    : links;

  return (
    <div className="min-h-screen bg-[var(--bg)] lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside
        id="app-sidebar"
        className={[
          "z-30 border-[var(--line)] bg-[var(--sidebar)] px-4 py-5",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-72 max-lg:border-r max-lg:shadow-[var(--shadow)]",
          open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
          "transition-transform duration-150 lg:sticky lg:top-0 lg:h-screen lg:border-r",
        ].join(" ")}
      >
        <BrandMark />
        <nav className="mt-8 grid gap-1" aria-label="Main">
          {visibleLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass} end={link.to === "/"} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-[var(--line)] pt-4">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-sm text-[var(--muted)]">{user?.email}</p>
          <div className="mt-3">
            <ApiStatus />
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--bg)]/90 px-4 py-3 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            className="btn btn-secondary lg:hidden"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="app-sidebar"
          >
            Menu
          </button>
          <p className="hidden font-display text-sm font-semibold tracking-wide text-[var(--muted)] sm:block lg:block">
            Plan projects. Manage tasks. Work together.
          </p>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
