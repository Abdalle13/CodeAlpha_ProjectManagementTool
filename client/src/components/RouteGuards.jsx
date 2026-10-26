import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function GuestRoute() {
  const { user, isAuthenticated, status } = useAuth();
  if (status === "loading") return null;
  const target = user?.systemRole === "admin" ? "/admin" : "/";
  return isAuthenticated ? <Navigate to={target} replace /> : <Outlet />;
}

export function ProtectedRoute() {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();
  if (status === "loading") return null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location.pathname }} replace />;
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
