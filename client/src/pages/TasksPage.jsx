export default function TasksPage() {
  const columns = ["To Do", "In Progress", "In Review", "Done"];

  return (
    <section>
      <h1 className="page-title">Tasks</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        The Kanban board will persist task status through the API. Columns are in place so the layout can be verified
        now.
      </p>
      <div className="mt-6 grid gap-4 overflow-x-auto md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <section key={column} className="min-w-[15rem] rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-4">
            <h2 className="font-display text-sm font-semibold tracking-wide uppercase">{column}</h2>
            <p className="mt-6 text-sm text-[var(--muted)]">No tasks in this column.</p>
          </section>
        ))}
      </div>
    </section>
  );
}
