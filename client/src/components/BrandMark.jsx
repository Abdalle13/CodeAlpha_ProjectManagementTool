export function TaskboraLogo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: "block",
        flexShrink: 0,
        borderRadius: `${size * 0.25}px`,
        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
      }}
      aria-label="Taskbora Logo"
    >
      <defs>
        <linearGradient id="taskbora-t-grad-app" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#taskbora-t-grad-app)" />
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="14.5"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      <path
        d="M 17 15 L 47 15 C 48.66 15 50 16.34 50 18 L 50 20 C 50 21.66 48.66 23 47 23 L 37 23 L 37 47 C 37 48.66 35.66 50 34 50 L 30 50 C 28.34 50 27 48.66 27 47 L 27 23 L 17 23 C 15.34 23 14 21.66 14 20 L 14 18 C 14 16.34 15.34 15 17 15 Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export default function BrandMark({ compact = false }) {
  const logoSize = compact ? 28 : 34;
  return (
    <div
      className="brand-mark"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? "0.55rem" : "0.75rem",
        userSelect: "none",
      }}
    >
      <TaskboraLogo size={logoSize} />
      <div style={{ lineHeight: 1.15 }}>
        <span
          style={{
            fontWeight: 800,
            fontSize: compact ? "1.08rem" : "1.28rem",
            letterSpacing: "-0.035em",
            color: "var(--ink)",
            display: "inline-block",
          }}
        >
          Taskbora
        </span>
      </div>
    </div>
  );
}
