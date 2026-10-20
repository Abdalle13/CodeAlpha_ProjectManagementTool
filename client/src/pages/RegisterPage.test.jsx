import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "../test/render.jsx";
import RegisterPage from "./RegisterPage.jsx";

vi.mock("../lib/api.js", () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error("unauthenticated")),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
  logoutAccount: vi.fn(),
  getHealth: vi.fn(),
  getErrorMessage: (error, fallback) => error?.response?.data?.error?.message || fallback,
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Taskora branding and validates incomplete registration", async () => {
    const user = userEvent.setup();
    renderApp(<RegisterPage />, { route: "/register" });

    expect(await screen.findByRole("heading", { name: /create your taskora account/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/name, email, and a password of at least 8 characters/i);
  });
});
