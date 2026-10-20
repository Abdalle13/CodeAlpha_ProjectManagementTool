export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  pending = false,
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="dialog-overlay" role="presentation" onClick={onCancel}>
      <div
        className="dialog-panel surface-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-display text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-3 text-[var(--muted)]">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
