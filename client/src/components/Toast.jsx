import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose, duration = 4500 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(t);
  }, [message, onClose, duration]);

  if (!message) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

  const bg = isSuccess
    ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
    : isError
    ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
    : "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)";

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: "1.25rem",
        right: "1.5rem",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: bg,
        color: "#ffffff",
        borderRadius: "12px",
        padding: "0.85rem 1.25rem",
        fontSize: "0.875rem",
        fontWeight: 600,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
        animation: "fade-in 180ms ease-out",
        maxWidth: "min(90vw, 26rem)",
      }}
    >
      <div style={{ flexShrink: 0, display: "grid", placeItems: "center" }}>
        {isSuccess && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {isError && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        {!isSuccess && !isError && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )}
      </div>

      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.85)",
            cursor: "pointer",
            padding: "0.2rem",
            display: "grid",
            placeItems: "center",
            borderRadius: "4px",
            transition: "opacity 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
