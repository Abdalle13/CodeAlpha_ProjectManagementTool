export default function ProjectsPage() {
  return (
    <section>
      <h1 className="page-title">Projects</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Project creation, membership, and access control will land in the projects phase. This list stays empty until
        those APIs exist.
      </p>
      <div className="surface-card mt-6 p-8">
        <p className="font-display text-xl font-semibold">No projects yet</p>
        <p className="mt-2 text-[var(--muted)]">Create a project after authentication is connected.</p>
      </div>
    </section>
  );
}
