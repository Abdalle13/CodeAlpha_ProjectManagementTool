import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { resetPasswordApi, getErrorMessage } from "../lib/api.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const navigate = useNavigate();

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [pending, setPending]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    setError("");
    try {
      await resetPasswordApi({ token, email, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reset password. The link may have expired."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Choose a secure password for your Taskora workspace account."
      switchText="Remembered your password?"
      switchTo="/login"
      switchLabel="Log In."
    >
      {success ? (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "var(--green-soft)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "1.5rem" }}>
            ✓
          </div>
          <p style={{ fontWeight: 600, color: "var(--ink)", margin: "0 0 0.5rem" }}>Password Reset Complete!</p>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", margin: "0 0 1.5rem" }}>Redirecting you to login in 3 seconds…</p>
          <Link to="/login" className="btn btn-primary" style={{ width: "100%", borderRadius: "8px" }}>
            Log In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: "1.1rem" }}>
          <div>
            <label className="label" htmlFor="new-pass" style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
              New Password
            </label>
            <input
              id="new-pass"
              className="input input-lg"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ borderRadius: "8px" }}
            />
          </div>

          <div>
            <label className="label" htmlFor="confirm-pass" style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
              Confirm New Password
            </label>
            <input
              id="confirm-pass"
              className="input input-lg"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
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
            {pending ? "Updating…" : "Update Password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
