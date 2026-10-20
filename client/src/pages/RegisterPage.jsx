import { useState } from "react";
import AuthLayout from "../layouts/AuthLayout.jsx";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!name || !email || password.length < 8) {
      setError("Enter your name, email, and a password of at least 8 characters.");
      return;
    }
    setError("Account registration will be available in the next phase.");
  }

  return (
    <AuthLayout
      title="Create your Taskora account"
      subtitle="Set up a workspace account to start planning projects with your team."
      switchText="Already have an account?"
      switchTo="/login"
      switchLabel="Sign in"
    >
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            className="input"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
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
            autoComplete="new-password"
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
          Create account
        </button>
      </form>
    </AuthLayout>
  );
}
