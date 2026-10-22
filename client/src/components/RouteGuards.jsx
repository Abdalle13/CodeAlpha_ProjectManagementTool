import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] px-6">
      <p className="text-[var(--muted)]" role="status">
        Loading Taskora…
      </p>
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, status } = useAuth();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function SystemAdminRoute() {
  const { user, status } = useAuth();

  if (status === "loading") return <LoadingScreen />;
  if (!user || user.systemRole !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
