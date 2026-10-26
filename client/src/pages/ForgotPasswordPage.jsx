import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { forgotPasswordApi, getErrorMessage } from "../lib/api.js";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice]   = useState("");
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your registered email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Please enter a valid email address (e.g. johndoe@gmail.com).");
      return;
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      const res = await forgotPasswordApi({ email });
      setNotice(res.message || "If that email is registered, a password reset link has been sent to your inbox.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send reset link. Please try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you a link to reset your password."
      switchText="Remembered your password?"
      switchTo="/login"
      switchLabel="Log In."
    >
      {notice ? (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "var(--green-soft)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "1.5rem" }}>
            ✓
          </div>
          <p style={{ fontWeight: 600, color: "var(--ink)", margin: "0 0 0.5rem" }}>Check Your Inbox</p>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", margin: "0 0 1.5rem", lineHeight: 1.5 }}>{notice}</p>
          <Link to="/login" className="btn btn-primary" style={{ width: "100%", borderRadius: "8px" }}>
            Back to Log In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: "1.1rem" }}>
          <div>
            <label className="label" htmlFor="forgot-email" style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
              Email Address
            </label>
            <input
              id="forgot-email"
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

          {error && (
            <div style={{ padding: "0.75rem", borderRadius: "8px", background: "var(--red-soft)", color: "var(--red)", fontSize: "0.8125rem", border: "1px solid var(--red)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", borderRadius: "8px", fontWeight: 700 }}
            disabled={pending}
          >
            {pending ? "Sending Link…" : "Send Reset Link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
