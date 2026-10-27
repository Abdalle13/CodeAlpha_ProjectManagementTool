import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function AuthSpinner() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #0f172a)",
        zIndex: 9998,
        gap: "1.25rem",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          border: "3px solid rgba(99, 102, 241, 0.15)",
          borderTop: "3px solid #6366f1",
          animation: "auth-spin 650ms linear infinite",
        }}
      />
      <span
        style={{
          color: "rgba(148,163,184,0.6)",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Loading Taskora...
      </span>
      <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function GuestRoute() {
  const { user, isAuthenticated, status } = useAuth();
  if (status === "loading") return <AuthSpinner />;
  const target = user?.systemRole === "admin" ? "/admin" : "/";
  return isAuthenticated ? <Navigate to={target} replace /> : <Outlet />;
}

export function ProtectedRoute() {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <AuthSpinner />;
  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

export function SystemAdminRoute() {
  const { user } = useAuth();
  return user?.systemRole === "admin" ? <Outlet /> : <Navigate to="/" replace />;
}

export function MemberRoute() {
  const { user } = useAuth();
  // Admins must strictly only use the Admin Console (/admin), never regular home/workspace
  return user?.systemRole === "admin" ? <Navigate to="/admin" replace /> : <Outlet />;
}
