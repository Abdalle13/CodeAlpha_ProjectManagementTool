import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bootstrapSystemAdmin, getErrorMessage } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminSetupPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true); setError("");
    try {
      await bootstrapSystemAdmin(token);
      await refreshUser();
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Invalid or expired setup token."));
    } finally {
      setPending(false);
    }
  }

  return (
    <section style={{ maxWidth: "28rem", margin: "4rem auto", padding: "0 1rem" }}>
      <div className="card-raised" style={{ padding: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>System setup</h1>
        <p style={{ margin: "0 0 1.5rem", color: "var(--muted)", fontSize: "0.875rem" }}>Enter the bootstrap token to claim admin access.</p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label className="label" htmlFor="setup-token">Bootstrap token</label>
            <input id="setup-token" className="input" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste token here" required />
          </div>
          {error && <p role="alert" style={{ margin: 0, color: "var(--red)", fontSize: "0.8125rem" }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={pending} style={{ justifySelf: "flex-end" }}>
            {pending ? "Verifying…" : "Claim admin access"}
          </button>
        </form>
      </div>
    </section>
  );
}
