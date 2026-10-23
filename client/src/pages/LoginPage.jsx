import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { getErrorMessage } from "../lib/api.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [pending,  setPending]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError("Enter your email and password."); return; }
    setPending(true); setError("");
    try {
      await login({ email, password });
      const next = location.state?.from && location.state.from !== "/login" ? location.state.from : "/";
      navigate(next, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Invalid credentials. Please try again."));
    } finally {
      setPending(false);
    }
  }

  async function handleDemo() {
    setPending(true); setError("");
    try {
      await login({ email: "demo@taskora.io", password: "Password123!" });
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Demo account unavailable."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Access your projects and task boards." switchText="No account?" switchTo="/register" switchLabel="Create one">
      <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: "0.875rem" }}>
        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input id="email" className="input input-lg" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" className="input input-lg" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" style={{ margin: 0, fontSize: "0.8125rem", color: "var(--red)" }}>{error}</p>}
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "0.25rem" }} disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.875rem", marginTop: "0.25rem" }}>
          <button type="button" onClick={handleDemo} disabled={pending} className="btn btn-secondary" style={{ width: "100%", fontSize: "0.8125rem" }}>
            Continue with demo account
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
