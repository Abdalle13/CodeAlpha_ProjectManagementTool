import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "../test/render.jsx";
import LoginPage from "./LoginPage.jsx";

vi.mock("../lib/api.js", () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error("unauthenticated")),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
  logoutAccount: vi.fn(),
  getHealth: vi.fn(),
  getErrorMessage: (error, fallback) => error?.response?.data?.error?.message || fallback,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Taskbora branding and validates empty credentials", async () => {
    const user = userEvent.setup();
    renderApp(<LoginPage />, { route: "/login" });

    // Wait for heading
    expect(await screen.findByRole("heading", { name: /sign in to taskbora/i })).toBeInTheDocument();

    // Submit empty form — should show error
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
