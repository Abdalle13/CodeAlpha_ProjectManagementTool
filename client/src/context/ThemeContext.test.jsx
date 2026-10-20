import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "./ThemeContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

describe("theme switching", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to light and persists dark mode", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    await user.click(screen.getByRole("button", { name: /switch to dark theme/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("taskora-theme")).toBe("dark");
  });
});
