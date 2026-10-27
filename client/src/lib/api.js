import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 10000,
});

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  return error?.response?.data?.error?.message || fallback;
}

export async function getHealth() {
  const response = await api.get("/health");
  return response.data;
}

export async function registerAccount(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data;
}

export async function loginAccount(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data;
}

export async function logoutAccount() {
  const response = await api.post("/auth/logout");
  return response.data;
}

export async function forgotPasswordApi(payload) {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
}

export async function resetPasswordApi(payload) {
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function getDashboard() {
  const response = await api.get("/dashboard");
  return response.data;
}

export async function listProjects(params = {}) {
  const response = await api.get("/projects", { params });
  return response.data;
}

export async function createProject(payload) {
  const response = await api.post("/projects", payload);
  return response.data;
}

export async function getProject(id) {
  const response = await api.get(`/projects/${id}`);
  return response.data;
}

export async function updateProject(id, payload) {
  const response = await api.patch(`/projects/${id}`, payload);
  return response.data;
}

export async function deleteProject(id) {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
}

export async function addProjectMember(id, payload) {
  const response = await api.post(`/projects/${id}/members`, payload);
  return response.data;
}

export async function updateProjectMember(projectId, userId, payload) {
  const response = await api.patch(`/projects/${projectId}/members/${userId}`, payload);
  return response.data;
}

export async function removeProjectMember(projectId, userId) {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
}

export async function listProjectTasks(projectId, params = {}) {
  const response = await api.get(`/projects/${projectId}/tasks`, { params });
  return response.data;
}

export async function listTasks(params = {}) {
  const response = await api.get("/tasks", { params });
  return response.data;
}

export async function createProjectTask(projectId, payload) {
  const response = await api.post(`/projects/${projectId}/tasks`, payload);
  return response.data;
}

export async function updateProjectTask(projectId, taskId, payload) {
  const response = await api.patch(`/projects/${projectId}/tasks/${taskId}`, payload);
  return response.data;
}

export async function deleteProjectTask(projectId, taskId) {
  const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  return response.data;
}

export async function listProjectActivity(projectId, params = {}) {
  const response = await api.get(`/projects/${projectId}/activity`, { params });
  return response.data;
}

export async function listTaskComments(projectId, taskId, params = {}) {
  const response = await api.get(`/projects/${projectId}/tasks/${taskId}/comments`, { params });
  return response.data;
}

export async function createTaskComment(projectId, taskId, payload) {
  const data = typeof payload === "string" ? { body: payload } : (payload?.body ? payload : { body: payload?.content || "" });
  const response = await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, data);
  return response.data;
}

export async function deleteTaskComment(projectId, taskId, commentId) {
  const response = await api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
  return response.data;
}

export async function getAdminStats() {
  const response = await api.get("/admin/stats");
  return response.data;
}

export async function listAdminUsers(params = {}) {
  const response = await api.get("/admin/users", { params });
  return response.data;
}

export async function bootstrapSystemAdmin(token) {
  const response = await api.post("/admin/bootstrap", { token });
  return response.data;
}

export async function createAdminUser(payload) {
  const response = await api.post("/admin/users", payload);
  return response.data;
}

export async function updateAdminUser(userId, payload) {
  const response = await api.patch(`/admin/users/${userId}`, payload);
  return response.data;
}

export async function deleteAdminUser(userId) {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
}

export async function listAdminProjects(params = {}) {
  const response = await api.get("/admin/projects", { params });
  return response.data;
}

export async function deleteAdminProject(projectId) {
  const response = await api.delete(`/admin/projects/${projectId}`);
  return response.data;
}

export async function listAdminActivity(params = {}) {
  const response = await api.get("/admin/activity", { params });
  return response.data;
}

export async function changePassword(payload) {
  const response = await api.put("/auth/password", payload);
  return response.data;
}

export async function updateProfile(payload) {
  const response = await api.put("/auth/profile", payload);
  return response.data;
}

export async function listTeamMembers() {
  const response = await api.get("/users");
  return response.data;
}

export async function listFeedActivity(params = {}) {
  const response = await api.get("/activity", { params });
  return response.data;
}

export default api;
