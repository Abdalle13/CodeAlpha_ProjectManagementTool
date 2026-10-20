import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import RegisterPage from "./RegisterPage.jsx";

function renderRegister() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <RegisterPage />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe("RegisterPage", () => {
  it("shows Taskora branding and validates incomplete registration", async () => {
    const user = userEvent.setup();
    renderRegister();

    expect(screen.getByRole("heading", { name: /create your taskora account/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/name, email, and a password of at least 8 characters/i);
  });
});
