import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import LoginPage from "./LoginPage.jsx";

function renderLogin() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("shows Taskora branding and validates empty credentials", async () => {
    const user = userEvent.setup();
    renderLogin();

    expect(screen.getByRole("heading", { name: /sign in to taskora/i })).toBeInTheDocument();
    expect(screen.getByText(/plan projects\. manage tasks\. work together\./i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/enter your email and password/i);
  });
});
