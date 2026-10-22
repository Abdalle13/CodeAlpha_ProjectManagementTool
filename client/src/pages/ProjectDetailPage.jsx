import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ProjectForm from "../components/ProjectForm.jsx";
import {
  addProjectMember,
  deleteProject,
  getErrorMessage,
  getProject,
  listProjectActivity,
  removeProjectMember,
  updateProject,
  updateProjectMember,
} from "../lib/api.js";
import { canManageProject, formatDate, statusLabel } from "../lib/projects.js";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [activity, setActivity] = useState([]);
  const [activityError, setActivityError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    setActivityError("");
    try {
      const payload = await getProject(id);
      setProject(payload.data.project);
      try {
        const activityPayload = await listProjectActivity(id, { limit: 20 });
        setActivity(activityPayload.data.items);
      } catch (err) {
        setActivityError(getErrorMessage(err, "Unable to load project activity."));
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load this project."));
      setProject(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleUpdate(values) {
    setPending(true);
    setError("");
    try {
      const payload = await updateProject(id, values);
      setProject(payload.data.project);
      setEditing(false);
      setNotice("Project updated.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update this project."));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    setError("");
    try {
      await deleteProject(id);
      navigate("/projects", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete this project."));
      setPending(false);
      setConfirmDelete(false);
    }
  }

  async function handleAddMember(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const payload = await addProjectMember(id, { email: memberEmail, role: memberRole });
      setProject(payload.data.project);
      setMemberEmail("");
      setMemberRole("member");
      setNotice("Member added.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to add that member."));
    } finally {
      setPending(false);
    }
  }

  async function handleRoleChange(userId, role) {
    setPending(true);
    setError("");
    try {
      const payload = await updateProjectMember(id, userId, { role });
      setProject(payload.data.project);
      setNotice("Member role updated.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update that member."));
    } finally {
      setPending(false);
    }
  }

  async function handleRemoveMember(userId) {
    setPending(true);
    setError("");
    try {
      const payload = await removeProjectMember(id, userId);
      setProject(payload.data.project);
      setNotice("Member removed.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to remove that member."));
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <p className="text-[var(--muted)]" role="status">
        Loading project…
      </p>
    );
  }

  if (!project) {
    return (
      <section>
        <p className="text-[var(--danger)]" role="alert">
          {error || "Project not found."}
        </p>
        <Link className="btn btn-secondary mt-4" to="/projects">
          Back to projects
        </Link>
      </section>
    );
  }

  const canManage = canManageProject(project.myRole);
  const canDelete = project.myRole === "owner";

  return (
    <section>
      <p className="text-sm text-[var(--muted)]">
        <Link className="font-semibold text-[var(--accent)] hover:underline" to="/projects">
          Projects
        </Link>
      </p>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="mt-2 max-w-3xl text-[var(--muted)]">{project.description || "No description yet."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage ? (
            <button type="button" className="btn btn-secondary" onClick={() => setEditing((value) => !value)}>
              {editing ? "Close editor" : "Edit project"}
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          ) : null}
        </div>
      </div>

      {notice ? (
        <p className="mt-4 text-sm text-[var(--accent)]" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card p-4">
          <dt className="text-sm text-[var(--muted)]">Status</dt>
          <dd className="mt-1 font-display font-semibold">{statusLabel(project.status)}</dd>
        </div>
        <div className="surface-card p-4">
          <dt className="text-sm text-[var(--muted)]">Your role</dt>
          <dd className="mt-1 font-display font-semibold capitalize">{project.myRole}</dd>
        </div>
        <div className="surface-card p-4">
          <dt className="text-sm text-[var(--muted)]">Start date</dt>
          <dd className="mt-1 font-display font-semibold">{formatDate(project.startDate)}</dd>
        </div>
        <div className="surface-card p-4">
          <dt className="text-sm text-[var(--muted)]">Due date</dt>
          <dd className="mt-1 font-display font-semibold">{formatDate(project.dueDate)}</dd>
        </div>
      </dl>

      {editing ? (
        <div className="surface-card mt-6 p-6">
          <h2 className="font-display text-lg font-semibold">Edit project</h2>
          <div className="mt-4">
            <ProjectForm
              initialValue={project}
              submitLabel="Save changes"
              pending={pending}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="surface-card mt-6 p-6">
        <h2 className="font-display text-lg font-semibold">Members</h2>
        <ul className="mt-4 grid gap-3">
          {project.members.map((member) => (
            <li key={member.user.id} className="flex flex-col gap-3 border-b border-[var(--line)] pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{member.user.name}</p>
                <p className="text-sm text-[var(--muted)]">{member.user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canManage ? (
                  <label className="sr-only" htmlFor={`role-${member.user.id}`}>
                    Role for {member.user.name}
                  </label>
                ) : null}
                    {canManage ? (
                  <select
                    id={`role-${member.user.id}`}
                    className="input min-h-10 w-36"
                    value={member.role}
                    disabled={pending}
                    onChange={(event) => handleRoleChange(member.user.id, event.target.value)}
                  >
                    {project.myRole === "owner" ? <option value="owner">Owner</option> : null}
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <p className="capitalize text-sm">{member.role}</p>
                )}
                {canManage ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={pending}
                    onClick={() => handleRemoveMember(member.user.id)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {canManage ? (
          <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_8rem_auto]" onSubmit={handleAddMember}>
            <div>
              <label className="label" htmlFor="member-email">
                Add member by email
              </label>
              <input
                id="member-email"
                className="input"
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="member-role">
                Role
              </label>
              <select
                id="member-role"
                className="input"
                value={memberRole}
                onChange={(event) => setMemberRole(event.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full" disabled={pending}>
                Add
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <section className="mt-8 border-t border-[var(--line)] pt-6" aria-labelledby="project-activity-heading">
        <h2 id="project-activity-heading" className="font-display text-lg font-semibold">Activity</h2>
        {activityError ? <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{activityError}</p> : null}
        {activity.length ? (
          <ol className="mt-4 grid gap-4">
            {activity.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 border-l-2 border-[var(--line)] pl-4 sm:flex-row sm:items-baseline sm:justify-between">
                <p><span className="font-medium">{item.actor.name}</span> {item.summary}</p>
                <time className="shrink-0 text-sm text-[var(--muted)]" dateTime={item.createdAt}>
                  {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">No activity has been recorded yet.</p>
        )}
      </section>

      {confirmDelete ? (
        <ConfirmDialog
          title="Delete this project?"
          message="This permanently removes the project, its tasks, comments, and activity history."
          confirmLabel="Delete project"
          danger
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : null}
    </section>
  );
}
