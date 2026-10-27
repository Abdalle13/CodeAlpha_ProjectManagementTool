import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "../context/AuthContext.jsx";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import { ProtectedRoute, SystemAdminRoute } from "./RouteGuards.jsx";

function renderWithAuth(value) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <ThemeProvider>
        <AuthContext.Provider value={value}>
          <Routes>
            <Route path="/login" element={<p>Sign in to Taskora</p>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<p>Dashboard</p>} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state while the session is checked", () => {
    renderWithAuth({ user: null, status: "loading", isAuthenticated: false });
    expect(document.body).toHaveTextContent(/loading taskora/i);
  });

  it("redirects anonymous visitors to login", () => {
    renderWithAuth({ user: null, status: "ready", isAuthenticated: false });
    expect(screen.getByText(/sign in to taskora/i)).toBeInTheDocument();
  });

  it("renders protected content for authenticated users", () => {
    renderWithAuth({
      user: { name: "Ada", email: "ada@taskora.test" },
      status: "ready",
      isAuthenticated: true,
    });
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});

describe("SystemAdminRoute", () => {
  it("redirects regular accounts away from administration", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <ThemeProvider>
          <AuthContext.Provider value={{ user: { systemRole: "user" }, status: "ready" }}>
            <Routes>
              <Route path="/" element={<p>Dashboard</p>} />
              <Route element={<SystemAdminRoute />}>
                <Route path="/admin" element={<p>System administration</p>} />
              </Route>
            </Routes>
          </AuthContext.Provider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders administration for system admins", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <ThemeProvider>
          <AuthContext.Provider value={{ user: { systemRole: "admin" }, status: "ready" }}>
            <Routes>
              <Route path="/" element={<p>Dashboard</p>} />
              <Route element={<SystemAdminRoute />}>
                <Route path="/admin" element={<p>System administration</p>} />
              </Route>
            </Routes>
          </AuthContext.Provider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("System administration")).toBeInTheDocument();
  });
});
