import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import { Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute, MemberRoute, ProtectedRoute, SystemAdminRoute } from "./components/RouteGuards.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import TeamPage from "./pages/TeamPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import ActivityPage from "./pages/ActivityPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import AdminProjectsPage from "./pages/AdminProjectsPage.jsx";
import AdminReportsPage from "./pages/AdminReportsPage.jsx";
import AdminRolesPage from "./pages/AdminRolesPage.jsx";
import AdminSetupPage from "./pages/AdminSetupPage.jsx";

function DynamicFallback() {
  const { user } = useAuth();
  return <Navigate to={user?.systemRole === "admin" ? "/admin" : "/"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Member / Regular User Routes: Admins are blocked and redirected to /admin */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MemberRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/members" element={<TeamPage />} />
            <Route path="/team" element={<Navigate to="/members" replace />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/admin/setup" element={<AdminSetupPage />} />
          </Route>
        </Route>
      </Route>

      {/* Dedicated Admin Pages: Only Admins can access */}
      <Route element={<ProtectedRoute />}>
        <Route element={<SystemAdminRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/projects" element={<AdminProjectsPage />} />
            <Route path="/admin/roles" element={<AdminRolesPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Account Settings: Shared layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<DynamicFallback />} />
    </Routes>
  );
}
