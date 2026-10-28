import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginAccount, logoutAccount, registerAccount } from "../lib/api.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("taskora_token"));
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(hasToken ? "loading" : "ready");

  const refreshUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("taskora_token") : null;
    if (!token) {
      setUser(null);
      setStatus("ready");
      return;
    }

    // Hard safety timeout: if API never responds (e.g. server down), stop loading after 10s
    let safetyFired = false;
    const safetyTimer = setTimeout(() => {
      safetyFired = true;
      setUser(null);
      setStatus("ready");
      if (typeof window !== "undefined") {
        localStorage.removeItem("taskora_token");
      }
    }, 10000);

    try {
      const payload = await getCurrentUser();
      if (!safetyFired) {
        setUser(payload.data.user);
      }
    } catch {
      if (!safetyFired) {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("taskora_token");
        }
      }
    } finally {
      clearTimeout(safetyTimer);
      if (!safetyFired) {
        setStatus("ready");
      }
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
