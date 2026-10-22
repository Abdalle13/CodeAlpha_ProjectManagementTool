import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { bootstrapSystemAdmin, getErrorMessage } from "../lib/api.js";

export default function AdminSetupPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await bootstrapSystemAdmin(token);
      await refreshUser();
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to initialize system administration."));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="page-title">Initialize system admin</h1>
      <p className="mt-2 text-[var(--muted)]">
        Sign in with the account configured as the initial administrator, then enter the one-time token from the server environment.
      </p>
      <p className="mt-4 text-sm">Signed in as {user?.email}</p>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
      <form className="surface-card mt-6 grid gap-4 p-5" onSubmit={handleSubmit}>
        <div>
          <label className="label" htmlFor="admin-bootstrap-token">One-time setup token</label>
          <input
            id="admin-bootstrap-token"
            className="input"
            type="password"
            autoComplete="one-time-code"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />
        </div>
        <div>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Initializing…" : "Initialize admin access"}
          </button>
        </div>
      </form>
    </section>
  );
}