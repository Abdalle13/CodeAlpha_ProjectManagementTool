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

  async function handleDemoLogin() {
    setEmail("demo@taskora.io");
    setPassword("Password123!");
    setPending(true);
    setError("");
    try {
      await login({ email: "demo@taskora.io", password: "Password123!" });
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to sign in with demo account."));
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
            placeholder="e.g. demo@taskora.io"
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
            placeholder="••••••••"
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

        <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Testing or reviewing?</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">1-Click Demo</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={pending}
            className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>⚡ Instant Demo Login (Lead Dev)</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
