import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { getErrorMessage } from "../lib/api.js";

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [loginInput, setLoginInput]       = useState("");
  const [password,   setPassword]         = useState("");
  const [rememberMe, setRememberMe]       = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [error,      setError]            = useState("");
  const [pending,    setPending]          = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!loginInput || !password) {
      setError("Please enter your email or username and password.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const loggedUser = await login({ email: loginInput, password });
      const defaultDest = loggedUser?.systemRole === "admin" ? "/admin" : "/";
      const next = location.state?.from && location.state.from !== "/login" ? location.state.from : defaultDest;
      navigate(loggedUser?.systemRole === "admin" ? "/admin" : next, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Invalid credentials. Please verify your details."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Enter your email and password to access your account."
      switchText="Don't Have An Account?"
      switchTo="/register"
      switchLabel="Register Now."
    >
      <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: "1.1rem" }}>
        <div>
          <label className="label" htmlFor="login-input" style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
            Email
          </label>
          <input
            id="login-input"
            className="input input-lg"
            type="text"
            autoComplete="username"
            placeholder="johndoe@gmail.com"
            value={loginInput}
            onChange={e => setLoginInput(e.target.value)}
            required
            style={{ borderRadius: "8px" }}
          />
        </div>

        <div>
          <label className="label" htmlFor="password" style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              className="input input-lg"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: "2.5rem", borderRadius: "8px" }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: "0.25rem",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.825rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--muted)", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ cursor: "pointer", accentColor: "var(--accent)" }}
            />
            Remember Me
          </label>
          <Link
            to="/forgot-password"
            style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
          >
            Forgot Your Password?
          </Link>
        </div>

        {error && (
          <div style={{ padding: "0.75rem", borderRadius: "8px", background: "var(--red-soft)", color: "var(--red)", fontSize: "0.8125rem", border: "1px solid var(--red)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: "100%", borderRadius: "8px", fontWeight: 700, marginTop: "0.25rem" }}
          disabled={pending}
        >
          {pending ? "Logging In…" : "Log In"}
        </button>
      </form>
    </AuthLayout>
  );
}
