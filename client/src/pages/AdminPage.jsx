import { useCallback, useEffect, useState } from "react";
import {
  deleteAdminProject,
  getErrorMessage,
  listAdminProjects,
  listAdminUsers,
  updateAdminUser,
} from "../lib/api.js";
import { formatDate } from "../lib/projects.js";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [userPagination, setUserPagination] = useState(null);
  const [projectPagination, setProjectPagination] = useState(null);
  const [userQuery, setUserQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (userPage = 1, projectPage = 1, query = "") => {
    setLoading(true);
    setError("");
    try {
      const [userPayload, projectPayload] = await Promise.all([
        listAdminUsers({ limit: 20, page: userPage, q: query || undefined }),
        listAdminProjects({ limit: 20, page: projectPage }),
      ]);
      setUsers(userPayload.data.items);
      setProjects(projectPayload.data.items);
      setUserPagination(userPayload.data.pagination);
      setProjectPagination(projectPayload.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load system administration data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUserUpdate(user, payload) {
    setPendingId(user.id);
    setError("");
    try {
      const response = await updateAdminUser(user.id, payload);
      setUsers((current) => current.map((item) => item.id === user.id ? response.data.user : item));
      setNotice(`${user.name}'s account was updated.`);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update this account."));
    } finally {
      setPendingId("");
    }
  }

  async function handleProjectDelete(project) {
    if (!window.confirm(`Delete project "${project.name}" and its tasks? This cannot be undone.`)) return;
    setPendingId(project.id);
    setError("");
    try {
      await deleteAdminProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setNotice(`${project.name} was deleted.`);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete this project."));
    } finally {
      setPendingId("");
    }
  }

  return (
    <section>
      <div>
        <h1 className="page-title">System administration</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">Manage Taskora accounts and projects across the system.</p>
      </div>

      {notice ? <p className="mt-4 text-sm text-[var(--accent)]" role="status">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
      {loading ? <p className="mt-6 text-[var(--muted)]" role="status">Loading administration data…</p> : null}

      {!loading ? (
        <>
          <section className="mt-8" aria-labelledby="admin-users-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="admin-users-heading" className="font-display text-xl font-semibold">Accounts</h2>
              <p className="text-sm text-[var(--muted)]">{userPagination?.total ?? users.length} accounts</p>
            </div>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                load(1, projectPagination?.page || 1, userQuery);
              }}
            >
              <label className="sr-only" htmlFor="admin-user-search">Search accounts</label>
              <input
                id="admin-user-search"
                className="input sm:max-w-sm"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
                placeholder="Search name or email"
              />
              <button type="submit" className="btn btn-secondary">Search</button>
            </form>
            {users.length ? (
              <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--line)]">
                <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                  <thead className="bg-[var(--surface-muted)] text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium"><span className="sr-only">Account actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-[var(--line)]">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3 capitalize">{user.systemRole}</td>
                        <td className="px-4 py-3">{user.isActive ? "Active" : "Suspended"}</td>
                        <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="btn btn-secondary min-h-9 px-2 py-1 text-sm"
                              disabled={pendingId === user.id}
                              onClick={() => handleUserUpdate(user, { systemRole: user.systemRole === "admin" ? "user" : "admin" })}
                            >
                              {user.systemRole === "admin" ? "Remove admin" : "Make admin"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary min-h-9 px-2 py-1 text-sm"
                              disabled={pendingId === user.id}
                              onClick={() => handleUserUpdate(user, { isActive: !user.isActive })}
                            >
                              {user.isActive ? "Suspend" : "Reactivate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="surface-card mt-4 p-5 text-[var(--muted)]">No accounts found.</p>}
            {userPagination?.pages > 1 ? (
              <div className="mt-3 flex items-center justify-end gap-3">
                <span className="text-sm text-[var(--muted)]">Page {userPagination.page} of {userPagination.pages}</span>
                <button
                  type="button"
                  className="btn btn-secondary min-h-9 px-3 py-1 text-sm"
                  disabled={userPagination.page <= 1 || loading}
                  onClick={() => load(userPagination.page - 1, projectPagination?.page || 1, userQuery)}
                >Previous accounts</button>
                <button
                  type="button"
                  className="btn btn-secondary min-h-9 px-3 py-1 text-sm"
                  disabled={userPagination.page >= userPagination.pages || loading}
                  onClick={() => load(userPagination.page + 1, projectPagination?.page || 1, userQuery)}
                >Next accounts</button>
              </div>
            ) : null}
          </section>

          <section className="mt-10" aria-labelledby="admin-projects-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="admin-projects-heading" className="font-display text-xl font-semibold">Projects</h2>
              <p className="text-sm text-[var(--muted)]">{projectPagination?.total ?? projects.length} projects</p>
            </div>
            {projects.length ? (
              <ul className="mt-4 grid gap-3">
                {projects.map((project) => (
                  <li key={project.id} className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{project.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Owner: {project.owner?.name || "Unknown"} · {project.members.length} members · {project.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger shrink-0"
                      disabled={pendingId === project.id}
                      onClick={() => handleProjectDelete(project)}
                    >
                      Delete project
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="surface-card mt-4 p-5 text-[var(--muted)]">No projects found.</p>}
            {projectPagination?.pages > 1 ? (
              <div className="mt-3 flex items-center justify-end gap-3">
                <span className="text-sm text-[var(--muted)]">Page {projectPagination.page} of {projectPagination.pages}</span>
                <button
                  type="button"
                  className="btn btn-secondary min-h-9 px-3 py-1 text-sm"
                  disabled={projectPagination.page <= 1 || loading}
                  onClick={() => load(userPagination?.page || 1, projectPagination.page - 1, userQuery)}
                >Previous projects</button>
                <button
                  type="button"
                  className="btn btn-secondary min-h-9 px-3 py-1 text-sm"
                  disabled={projectPagination.page >= projectPagination.pages || loading}
                  onClick={() => load(userPagination?.page || 1, projectPagination.page + 1, userQuery)}
                >Next projects</button>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );
}