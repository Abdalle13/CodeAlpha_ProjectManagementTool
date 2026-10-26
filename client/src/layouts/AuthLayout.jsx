import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark.jsx";

export default function AuthLayout({ title, subtitle, children, switchText, switchTo, switchLabel }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "2rem 1rem",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "27rem",
          padding: "2.5rem 2rem",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Logo and Name inside card top */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <BrandMark />
          </Link>
        </div>

        {/* Title & Subtitle */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <h1
            style={{
              margin: "0 0 0.4rem",
              fontSize: "1.85rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "var(--muted)",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Form Body */}
        {children}

        {/* Bottom Switch Link */}
        {switchText && (
          <div
            style={{
              marginTop: "1.75rem",
              textAlign: "center",
              fontSize: "0.85rem",
              color: "var(--muted)",
            }}
          >
            {switchText}{" "}
            <Link
              to={switchTo}
              style={{
                color: "var(--accent)",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {switchLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
