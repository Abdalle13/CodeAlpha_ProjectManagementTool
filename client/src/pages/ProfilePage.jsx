import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Avatar } from "../layouts/AppLayout.jsx";

export default function ProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("info");

  if (!user) return null;
  return (
    <section>
      <h1 className="page-title">Profile</h1>
      <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>Your account details and settings.</p>

      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
        {["info", "security"].map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ padding: "0.5rem 1rem", background: "none", border: "none", cursor: "pointer", fontWeight: tab === t ? 600 : 400, color: tab === t ? "var(--ink)" : "var(--muted)", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent", fontSize: "0.875rem", transition: "color 120ms" }}>
            {t === "info" ? "Information" : "Security"}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="card" style={{ marginTop: "1.5rem", padding: "1.5rem", display: "grid", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Avatar name={user.name} size={52} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.0625rem" }}>{user.name}</p>
              <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.8125rem" }}>{user.email}</p>
              <span className={"badge " + (user.systemRole === "admin" ? "badge-purple" : "badge-gray")} style={{ marginTop: "0.4rem" }}>
                {user.systemRole === "admin" ? "Administrator" : "Member"}
              </span>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "0.5rem 1.5rem", fontSize: "0.875rem", alignItems: "center" }}>
            <span style={{ color: "var(--muted)", fontWeight: 600 }}>Name</span><span>{user.name}</span>
            <span style={{ color: "var(--muted)", fontWeight: 600 }}>Email</span><span>{user.email}</span>
            <span style={{ color: "var(--muted)", fontWeight: 600 }}>Role</span><span className="truncate" style={{ textTransform: "capitalize" }}>{user.systemRole}</span>
          </div>
        </div>
      )}
      {tab === "security" && (
        <div className="card" style={{ marginTop: "1.5rem", padding: "1.5rem" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Password change functionality coming soon.</p>
        </div>
      )}
    </section>
  );
}
