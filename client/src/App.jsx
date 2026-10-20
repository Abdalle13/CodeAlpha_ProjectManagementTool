import { Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute, ProtectedRoute } from "./components/RouteGuards.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
