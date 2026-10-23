import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function GuestRoute() {
  const { isAuthenticated, status } = useAuth();
  if (status === "loading") return null;
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
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
