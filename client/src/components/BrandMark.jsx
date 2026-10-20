export default function BrandMark({ compact = false }) {
  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
      <span
        aria-hidden="true"
        className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)]"
      >
        <span className="block h-4 w-4 rounded-[3px] border-2 border-[var(--accent)] border-r-transparent" />
      </span>
      <div className="leading-tight">
        <p className={`font-display font-bold tracking-[-0.04em] ${compact ? "text-base" : "text-[1.15rem]"}`}>
          Taskora
        </p>
      </div>
    </div>
  );
}
