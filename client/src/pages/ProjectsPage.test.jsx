import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "../test/render.jsx";
import ProjectsPage from "./ProjectsPage.jsx";

vi.mock("../lib/api.js", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    data: { user: { id: "u1", name: "Ada Lovelace", email: "ada@taskora.test" } },
  }),
  listProjects: vi.fn(),
  createProject: vi.fn(),
  getErrorMessage: (error, fallback) => error?.response?.data?.error?.message || fallback,
}));

import { createProject, listProjects } from "../lib/api.js";

describe("ProjectsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listProjects.mockResolvedValue({
      data: { items: [], pagination: { page: 1, limit: 12, total: 0, pages: 1 } },
    });
  });

  it("shows an empty state and opens the create project form", async () => {
    const user = userEvent.setup();
    renderApp(<ProjectsPage />, { route: "/projects" });

    expect(await screen.findByText(/no projects yet/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /new project/i }));
    expect(screen.getByRole("dialog", { name: /new project/i })).toBeInTheDocument();
  });

  it("renders projects returned by the API", async () => {
    listProjects.mockResolvedValue({
      data: {
        items: [
          {
            id: "p1",
            name: "Website refresh",
            description: "Rebuild the marketing site.",
            status: "active",
            members: [{ user: { id: "u1" }, role: "owner" }],
            myRole: "owner",
            dueDate: null,
          },
        ],
        pagination: { page: 1, limit: 12, total: 1, pages: 1 },
      },
    });

    renderApp(<ProjectsPage />, { route: "/projects" });
    expect(await screen.findByRole("link", { name: /website refresh/i })).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });
});
