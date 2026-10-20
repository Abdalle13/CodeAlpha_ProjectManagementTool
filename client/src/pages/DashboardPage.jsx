export default function DashboardPage() {
  return (
    <section>
      <h1 className="page-title">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Once accounts, projects, and tasks are connected, this page will show live counts, deadlines, and progress for
        your Taskora workspace.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Projects", "Assigned tasks", "In progress", "Completed"].map((label) => (
          <article key={label} className="surface-card p-5">
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="mt-3 font-display text-3xl font-bold">0</p>
            <p className="mt-2 text-sm text-[var(--muted)]">No workspace data yet.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
