import { useState } from "react";
import AuthLayout from "../layouts/AuthLayout.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setError("Account sign-in will be available in the next phase.");
  }

  return (
    <AuthLayout
      title="Sign in to Taskora"
      subtitle="Use your work email to open your projects and task boards."
      switchText="Need an account?"
      switchTo="/register"
      switchLabel="Create one"
    >
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn btn-primary mt-2" type="submit">
          Sign in
        </button>
      </form>
    </AuthLayout>
  );
}
