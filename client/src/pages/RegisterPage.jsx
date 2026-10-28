import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,       setError]       = useState("");
  const [pending,     setPending]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await register({ name, email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please check your details."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up for Taskbora to plan and manage your projects."
      switchText="Already Have An Account?"
      switchTo="/login"
      switchLabel="Log In."
    >
      <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: "1.1rem" }}>
        <div>
          <label className="label" htmlFor="reg-name" style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
            Full Name
          </label>
          <input
            id="reg-name"
            className="input input-lg"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ borderRadius: "8px" }}
          />
        </div>

        <div>
          <label className="label" htmlFor="reg-email" style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
            Email
          </label>
          <input
            id="reg-email"
            className="input input-lg"
            type="email"
            autoComplete="email"
            placeholder="johndoe@gmail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ borderRadius: "8px" }}
          />
        </div>

        <div>
          <label className="label" htmlFor="reg-password" style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="reg-password"
              className="input input-lg"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
          {pending ? "Creating Account…" : "Register Now"}
        </button>
      </form>
    </AuthLayout>
  );
}
