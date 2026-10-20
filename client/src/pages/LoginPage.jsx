import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { getErrorMessage } from "../lib/api.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setPending(true);
    setError("");
    try {
      await login({ email, password });
      const next = location.state?.from && location.state.from !== "/login" ? location.state.from : "/";
      navigate(next, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to sign in with those details."));
    } finally {
      setPending(false);
    }
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
        <button className="btn btn-primary mt-2" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
