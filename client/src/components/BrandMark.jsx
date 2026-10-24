export default function BrandMark({ compact = false }) {
  return (
    <div className="brand-mark" style={{ display: "inline-flex", alignItems: "center", gap: compact ? "0.5rem" : "0.75rem" }}>
      <span
        aria-hidden="true"
        style={{
          display: "grid",
          placeItems: "center",
          width: compact ? "1.875rem" : "2.25rem",
          height: compact ? "1.875rem" : "2.25rem",
          borderRadius: "0.625rem",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <span
          style={{
            display: "block",
            width: "1rem",
            height: "1rem",
            borderRadius: "3px",
            border: "2px solid var(--accent)",
            borderRightColor: "transparent"
          }}
        />
      </span>
      <div style={{ lineHeight: 1.15 }}>
        <span style={{ fontWeight: 800, fontSize: compact ? "1rem" : "1.2rem", letterSpacing: "-0.035em", color: "var(--ink)" }}>
          Taskora
        </span>
      </div>
    </div>
  );
}
