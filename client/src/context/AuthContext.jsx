import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginAccount, logoutAccount, registerAccount } from "../lib/api.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("taskbora_token"));
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(hasToken ? "loading" : "ready");

  const refreshUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("taskbora_token") : null;
    if (!token) {
      setUser(null);
      setStatus("ready");
      return;
    }

    try {
      const payload = await getCurrentUser();
      setUser(payload.data.user);
    } catch (err) {
      if (err?.response?.status === 401) {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("taskbora_token");
        }
      }
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    const payload = await loginAccount(credentials);
    setUser(payload.data.user);
    return payload.data.user;
  }, []);

  const register = useCallback(async (details) => {
    const payload = await registerAccount(details);
    setUser(payload.data.user);
    return payload.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAccount();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, status, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
