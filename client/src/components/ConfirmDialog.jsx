export default function ConfirmDialog({ open = true, title, message, confirmLabel = "Confirm", onConfirm, onCancel, danger = false }) {
  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: "26rem" }} role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={e => e.stopPropagation()}>
        <h2 id="confirm-title" style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700 }}>{title}</h2>
        {message && <p style={{ margin: "0 0 1.5rem", color: "var(--muted)", fontSize: "0.875rem" }}>{message}</p>}
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className={"btn " + (danger ? "btn-danger" : "btn-primary")} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
