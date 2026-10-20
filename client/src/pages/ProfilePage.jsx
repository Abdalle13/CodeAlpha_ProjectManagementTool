export default function ProfilePage() {
  return (
    <section>
      <h1 className="page-title">Profile</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Signed-in account details, session status, and logout will appear here after authentication is implemented.
      </p>
      <div className="surface-card mt-6 max-w-lg p-6">
        <p className="font-display text-lg font-semibold">Not signed in</p>
        <p className="mt-2 text-[var(--muted)]">Registration and login are the next milestone.</p>
      </div>
    </section>
  );
}
