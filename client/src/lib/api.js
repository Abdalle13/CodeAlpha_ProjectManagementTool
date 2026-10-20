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

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
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

export default api;
