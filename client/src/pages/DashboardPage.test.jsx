import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "../test/render.jsx";
import DashboardPage from "./DashboardPage.jsx";

vi.mock("../lib/api.js", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", name: "Ada" } } }),
  getDashboard: vi.fn(),
  getErrorMessage: (_error, fallback) => fallback,
}));

import { getDashboard } from "../lib/api.js";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDashboard.mockResolvedValue({
      data: {
        metrics: {
          totalProjects: 2,
          totalTasks: 3,
          assignedToMe: 1,
          inProgress: 1,
          completed: 1,
          overdue: 0,
          upcoming: 1,
        },
        taskStatus: [
          { status: "todo", count: 1 },
          { status: "in_progress", count: 1 },
          { status: "done", count: 1 },
        ],
        dueSoon: [
          {
            id: "t1",
            title: "Prepare release",
            status: "todo",
            dueDate: "2026-10-28T00:00:00.000Z",
            project: { id: "p1", name: "Website refresh" },
            assignee: { id: "u1", name: "Ada" },
          },
        ],
      },
    });
  });

  it("renders live metrics, task distribution, and upcoming deadlines", async () => {
    renderApp(<DashboardPage />, { route: "/" });
    // Wait for data to load
    expect(await screen.findByText("Prepare release")).toBeInTheDocument();
    // Dashboard metrics should show metric values
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(getDashboard).toHaveBeenCalledOnce();
  });
});
