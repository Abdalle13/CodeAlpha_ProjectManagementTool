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

  it("shows Taskora branding and validates empty credentials", async () => {
    const user = userEvent.setup();
    renderApp(<LoginPage />);

    expect(await screen.findByRole("heading", { name: /sign in to taskora/i })).toBeInTheDocument();
    expect(screen.getByText(/plan projects\. manage tasks\. work together\./i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/enter your email and password/i);
  });
});
