import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "../test/render.jsx";
import TasksPage from "./TasksPage.jsx";

vi.mock("../lib/api.js", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    data: { user: { id: "u1", name: "Ada Lovelace", email: "ada@taskbora.test" } },
  }),
  listProjects: vi.fn(),
  listTasks: vi.fn(),
  createProjectTask: vi.fn(),
  listTaskComments: vi.fn(),
  createTaskComment: vi.fn(),
  deleteTaskComment: vi.fn(),
  listTeamMembers: vi.fn().mockResolvedValue({ data: { items: [] } }),
  updateProjectTask: vi.fn(),
  deleteProjectTask: vi.fn(),
  getErrorMessage: (error, fallback) => error?.response?.data?.error?.message || fallback,
}));

import {
  createProjectTask,
  createTaskComment,
  listTasks,
  listProjects,
  listTaskComments,
  updateProjectTask,
} from "../lib/api.js";

const project = {
  id: "p1",
  name: "Website refresh",
  myRole: "owner",
  members: [{ user: { id: "u1", name: "Ada Lovelace" }, role: "owner" }],
};

describe("TasksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listProjects.mockResolvedValue({ data: { items: [project] } });
    listTasks.mockResolvedValue({
      data: {
        items: [
          {
            id: "t1",
            project: { id: "p1", name: "Website refresh" },
            title: "Prepare release notes",
            description: "Summarize the changes.",
            status: "todo",
            priority: "high",
            assignee: null,
            createdBy: { id: "u1", name: "Ada Lovelace" },
            dueDate: null,
          },
        ],
        pagination: { page: 1, limit: 50, total: 1, pages: 1 },
      },
    });
  });

  it("loads tasks into the matching Kanban column", async () => {
    renderApp(<TasksPage />, { route: "/tasks" });
    expect(await screen.findByText("Prepare release notes")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "To Do" })).toBeInTheDocument();
    expect(listTasks).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      status: undefined,
      priority: undefined,
      assignedToMe: undefined,
    });
  });

  it("creates a task through the project API", async () => {
    const user = userEvent.setup();
    renderApp(<TasksPage />, { route: "/tasks" });
    await screen.findByText("Prepare release notes");
    await user.type(screen.getByLabelText("New task"), "Review sprint plan");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() => expect(createProjectTask).toHaveBeenCalledWith("p1", {
      title: "Review sprint plan",
      description: "",
      priority: "medium",
      assigneeId: null,
      dueDate: null,
    }));
  });

  it("persists status changes and updates the task column", async () => {
    const user = userEvent.setup();
    updateProjectTask.mockResolvedValue({
      data: {
        task: {
          id: "t1",
          project: { id: "p1", name: "Website refresh" },
          title: "Prepare release notes",
          status: "in_progress",
          priority: "high",
          assignee: null,
          createdBy: { id: "u1", name: "Ada Lovelace" },
          dueDate: null,
        },
      },
    });
    renderApp(<TasksPage />, { route: "/tasks" });
    await screen.findByText("Prepare release notes");
    await user.selectOptions(screen.getByLabelText("Status for Prepare release notes"), "in_progress");

    await waitFor(() => expect(updateProjectTask).toHaveBeenCalledWith("p1", "t1", { status: "in_progress" }));
    expect(screen.getByRole("combobox", { name: "Status for Prepare release notes" })).toHaveValue("in_progress");
  });

  it("loads and posts comments for a task", async () => {
    const user = userEvent.setup();
    listTaskComments.mockResolvedValue({ data: { items: [] } });
    createTaskComment.mockResolvedValue({
      data: {
        comment: {
          id: "c1",
          author: { id: "u1", name: "Ada Lovelace" },
          body: "Looks ready.",
        },
      },
    });
    renderApp(<TasksPage />, { route: "/tasks" });
    await screen.findByText("Prepare release notes");
    await user.click(screen.getByRole("button", { name: "Comments" }));
    await screen.findByText("No comments yet.");
    await user.type(screen.getByLabelText("Add comment to Prepare release notes"), "Looks ready.");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(listTaskComments).toHaveBeenCalledWith("p1", "t1");
    expect(createTaskComment).toHaveBeenCalledWith("p1", "t1", { body: "Looks ready." });
    expect(await screen.findByText("Looks ready.")).toBeInTheDocument();
  });

  it("edits task details through the API", async () => {
    const user = userEvent.setup();
    updateProjectTask.mockResolvedValue({
      data: {
        task: {
          id: "t1",
          project: { id: "p1", name: "Website refresh" },
          title: "Publish release notes",
          description: "Summarize the changes.",
          status: "todo",
          priority: "high",
          assignee: null,
          createdBy: { id: "u1", name: "Ada Lovelace" },
          dueDate: null,
        },
      },
    });
    renderApp(<TasksPage />, { route: "/tasks" });
    await screen.findByText("Prepare release notes");
    await user.click(screen.getByRole("button", { name: "Edit Prepare release notes" }));
    const titleInput = screen.getByLabelText("Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Publish release notes");
    await user.click(screen.getByRole("button", { name: "Save task" }));

    expect(updateProjectTask).toHaveBeenCalledWith("p1", "t1", {
      title: "Publish release notes",
      description: "Summarize the changes.",
      priority: "high",
      dueDate: null,
      assigneeId: null,
    });
    expect(await screen.findByText("Publish release notes")).toBeInTheDocument();
  });
});