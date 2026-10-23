import { Link } from "react-router-dom";

export default function AuthLayout({ title, subtitle, children, switchText, switchTo, switchLabel }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "var(--bg)" }}>
      <div style={{ width: "min(26rem, 100%)" }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "2.25rem" }}>
          <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--ink)" }}>Taskora</span>
        </div>

        <div className="card-raised" style={{ padding: "2rem" }}>
          <h1 style={{ margin: "0 0 0.35rem", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h1>
          {subtitle && <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>{subtitle}</p>}
          {children}
        </div>

        {switchText && (
          <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.875rem", color: "var(--muted)" }}>
            {switchText}{" "}
            <Link to={switchTo} style={{ color: "var(--accent-text)", fontWeight: 600, textDecoration: "none" }}>{switchLabel}</Link>
          </p>
        )}
      </div>
    </div>
  );
}
