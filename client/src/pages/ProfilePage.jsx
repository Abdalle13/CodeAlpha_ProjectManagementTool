import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Avatar } from "../layouts/AppLayout.jsx";
import { changePassword, updateProfile, getErrorMessage } from "../lib/api.js";

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", top: "1.25rem", right: "1.5rem", zIndex: 9999,
      display: "flex", alignItems: "center", gap: "0.6rem",
      background: type === "success" ? "var(--green)" : "var(--red)",
      color: "#fff", borderRadius: "10px",
      padding: "0.75rem 1.1rem", fontSize: "0.875rem", fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      animation: "slide-up 200ms ease", maxWidth: "26rem",
    }}>
      {type === "success" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      )}
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, opacity: 0.8, display: "flex" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { user, login, refreshUser } = useAuth();
  const [tab, setTab] = useState("info");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // Profile edit form
  const [name, setName] = useState(user?.name || "");
  const [profilePending, setProfilePending] = useState(false);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwPending, setPwPending] = useState(false);

  if (!user) return null;

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setProfilePending(true);
    try {
      await updateProfile({ name });
      await refreshUser(); // update sidebar/navbar immediately
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update profile."), "error");
    } finally {
      setProfilePending(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    setPwPending(true);
    try {
      await changePassword({ currentPassword, newPassword });
      showToast("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(getErrorMessage(err, "Unable to change password. Verify your current password."), "error");
    } finally {
      setPwPending(false);
    }
  }

  return (
    <section className="fade-in" style={{ maxWidth: "48rem" }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Account Settings</h1>
        <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
          Manage your personal profile, security credentials, and workspace preferences.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        {[
          { id: "info", label: "Profile" },
          { id: "security", label: "Security & Password" },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: "0.6rem 1rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: tab === t.id ? 600 : 500,
              color: tab === t.id ? "var(--ink)" : "var(--muted)",
              borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              fontSize: "0.875rem",
              transition: "all 120ms ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Profile Info */}
      {tab === "info" && (
        <div className="card" style={{ padding: "1.75rem", display: "grid", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <Avatar name={user.name} size={64} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.125rem", color: "var(--ink)" }}>{user.name}</p>
              <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>{user.email}</p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <span className={"badge " + (user.systemRole === "admin" ? "badge-purple" : "badge-blue")}>
                  {user.systemRole === "admin" ? "Administrator" : "Team Member"}
                </span>
              </div>
            </div>
          </div>

          <div className="divider" />

          <form onSubmit={handleUpdateProfile} style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="label" htmlFor="name-input">Full name</label>
                <input
                  id="name-input"
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                />
              </div>
              <div>
                <label className="label" htmlFor="email-display">Email address</label>
                <input
                  id="email-display"
                  className="input"
                  value={user.email}
                  disabled
                  style={{ opacity: 0.7, background: "var(--surface2)" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={profilePending}>
                {profilePending ? "Saving changes…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Security & Password */}
      {tab === "security" && (
        <div className="card" style={{ padding: "1.75rem", display: "grid", gap: "1.25rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.0625rem", fontWeight: 700, color: "var(--ink)" }}>Change Password</h2>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted)" }}>
              Ensure your account is using a secure password of at least 8 characters.
            </p>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: "grid", gap: "1rem", maxWidth: "26rem" }}>
            <div>
              <label className="label" htmlFor="cur-pw">Current password</label>
              <input
                id="cur-pw"
                className="input"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="new-pw">New password (min. 8 characters)</label>
              <input
                id="new-pw"
                className="input"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="label" htmlFor="conf-pw">Confirm new password</label>
              <input
                id="conf-pw"
                className="input"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={pwPending}>
                {pwPending ? "Updating password…" : "Update password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
