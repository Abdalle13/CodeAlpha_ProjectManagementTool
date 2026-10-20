import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 10000,
});

export async function getHealth() {
  const response = await api.get("/health");
  return response.data;
}

export default api;
