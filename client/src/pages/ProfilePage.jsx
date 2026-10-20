import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    setError("");
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setError("Unable to sign out right now. Please try again.");
      setPending(false);
    }
  }

  return (
    <section>
      <h1 className="page-title">Profile</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Account details for your Taskora session. Sign out from any shared computer.
      </p>
      <div className="surface-card mt-6 max-w-lg p-6">
        <p className="font-display text-lg font-semibold">{user?.name}</p>
        <p className="mt-1 text-[var(--muted)]">{user?.email}</p>
        {error ? (
          <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn btn-secondary mt-6" type="button" onClick={handleLogout} disabled={pending}>
          {pending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </section>
  );
}
