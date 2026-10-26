import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "../test/render.jsx";
import AdminPage from "./AdminPage.jsx";

vi.mock("../lib/api.js", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    data: { user: { id: "admin1", name: "Taskora Admin", email: "root@taskora.test", systemRole: "admin" } },
  }),
  listAdminUsers: vi.fn(),
  updateAdminUser: vi.fn(),
  listAdminProjects: vi.fn(),
  deleteAdminProject: vi.fn(),
  getErrorMessage: (error, fallback) => error?.response?.data?.error?.message || fallback,
}));

import { listAdminProjects, listAdminUsers, updateAdminUser } from "../lib/api.js";

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listAdminUsers.mockResolvedValue({
      data: {
        items: [{
          id: "user1",
          name: "Grace Hopper",
          email: "grace@taskora.test",
          systemRole: "user",
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
        }],
      },
    });
    listAdminProjects.mockResolvedValue({
      data: {
        items: [{
          id: "project1",
          name: "Product launch",
          owner: { name: "Grace Hopper" },
          members: [{ user: { id: "user1" } }],
          status: "active",
        }],
      },
    });
  });

  it("shows all-account and project controls", async () => {
    const user = userEvent.setup();
    renderApp(<AdminPage />, { route: "/admin" });

    // Users tab shows first
    expect(await screen.findByText("grace@taskora.test")).toBeInTheDocument();

    // Click Projects tab to see project data
    await user.click(screen.getByRole("button", { name: /projects/i }));
    expect(await screen.findByText("Product launch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make admin" })).toBeInTheDocument();
  });

  it("sends role changes to the admin API", async () => {
    const user = userEvent.setup();
    updateAdminUser.mockResolvedValue({
      data: {
        user: {
          id: "user1",
          name: "Grace Hopper",
          email: "grace@taskora.test",
          systemRole: "admin",
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });
    renderApp(<AdminPage />, { route: "/admin" });
    await user.click(await screen.findByRole("button", { name: "Make admin" }));
    await waitFor(() => expect(updateAdminUser).toHaveBeenCalledWith("user1", { systemRole: "admin" }));
    expect(await screen.findByRole("button", { name: "Remove admin" })).toBeInTheDocument();
  });
});
