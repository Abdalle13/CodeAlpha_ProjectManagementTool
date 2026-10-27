import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute, MemberRoute, ProtectedRoute, SystemAdminRoute } from "./components/RouteGuards.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./layouts/AppLayout.jsx";

// Lazy-loaded pages — split into separate chunks for fast initial load
const DashboardPage      = lazy(() => import("./pages/DashboardPage.jsx"));
const LoginPage          = lazy(() => import("./pages/LoginPage.jsx"));
const RegisterPage       = lazy(() => import("./pages/RegisterPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.jsx"));
const ResetPasswordPage  = lazy(() => import("./pages/ResetPasswordPage.jsx"));
const ProfilePage        = lazy(() => import("./pages/ProfilePage.jsx"));
const ProjectsPage       = lazy(() => import("./pages/ProjectsPage.jsx"));
const ProjectDetailPage  = lazy(() => import("./pages/ProjectDetailPage.jsx"));
const TasksPage          = lazy(() => import("./pages/TasksPage.jsx"));
const TeamPage           = lazy(() => import("./pages/TeamPage.jsx"));
const AnalyticsPage      = lazy(() => import("./pages/AnalyticsPage.jsx"));
const ActivityPage       = lazy(() => import("./pages/ActivityPage.jsx"));
const AdminSetupPage     = lazy(() => import("./pages/AdminSetupPage.jsx"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage.jsx"));
const AdminUsersPage     = lazy(() => import("./pages/AdminUsersPage.jsx"));
const AdminProjectsPage  = lazy(() => import("./pages/AdminProjectsPage.jsx"));
const AdminReportsPage   = lazy(() => import("./pages/AdminReportsPage.jsx"));
const AdminRolesPage     = lazy(() => import("./pages/AdminRolesPage.jsx"));

function PageSpinner() {
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
        zIndex: 9999,
        gap: "1.25rem",
      }}
    >
      {/* Animated ring spinner */}
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: "3px solid rgba(99, 102, 241, 0.2)",
          borderTop: "3px solid #6366f1",
          animation: "spin 700ms linear infinite",
        }}
      />
      <span style={{ color: "rgba(148,163,184,0.7)", fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Loading…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DynamicFallback() {
  const { user } = useAuth();
  return <Navigate to={user?.systemRole === "admin" ? "/admin" : "/"} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Member / Regular User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MemberRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/"                element={<DashboardPage />} />
              <Route path="/projects"        element={<ProjectsPage />} />
              <Route path="/projects/:id"    element={<ProjectDetailPage />} />
              <Route path="/tasks"           element={<TasksPage />} />
              <Route path="/members"         element={<TeamPage />} />
              <Route path="/team"            element={<Navigate to="/members" replace />} />
              <Route path="/analytics"       element={<AnalyticsPage />} />
              <Route path="/activity"        element={<ActivityPage />} />
              <Route path="/admin/setup"     element={<AdminSetupPage />} />
            </Route>
          </Route>
        </Route>

        {/* Admin-only Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<SystemAdminRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/admin"          element={<AdminDashboardPage />} />
              <Route path="/admin/users"    element={<AdminUsersPage />} />
              <Route path="/admin/projects" element={<AdminProjectsPage />} />
              <Route path="/admin/roles"    element={<AdminRolesPage />} />
              <Route path="/admin/reports"  element={<AdminReportsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Shared: Account Settings */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<DynamicFallback />} />
      </Routes>
    </Suspense>
  );
}
