import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  createTaskComment,
  createProjectTask,
  deleteProjectTask,
  getErrorMessage,
  listTaskComments,
  listTasks,
  listProjects,
  updateProjectTask,
} from "../lib/api.js";
import { formatDate } from "../lib/projects.js";

const columns = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];
const priorities = ["low", "medium", "high", "urgent"];
const emptyForm = { projectId: "", title: "", description: "", priority: "medium", assigneeId: "", dueDate: "" };
const emptyEditForm = { title: "", description: "", priority: "medium", assigneeId: "", dueDate: "" };

export default function TasksPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [openComments, setOpenComments] = useState("");
  const [comments, setComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [editingTaskId, setEditingTaskId] = useState("");
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [taskPagination, setTaskPagination] = useState(null);
  const [taskFilters, setTaskFilters] = useState({ status: "", priority: "", assignedToMe: false });

  useEffect(() => {
    let active = true;
    Promise.all([listProjects({ limit: 50 }), listTasks({ page: 1, limit: 50 })])
      .then(([projectPayload, taskPayload]) => {
        if (!active) return;
        const accessibleProjects = projectPayload.data.items;
        setProjects(accessibleProjects);
        setTasks(taskPayload.data.items);
        setTaskPagination(taskPayload.data.pagination);
        setForm((current) => ({
          ...current,
          projectId: accessibleProjects.some((project) => project.id === current.projectId)
            ? current.projectId
            : accessibleProjects[0]?.id || "",
        }));
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Unable to load tasks."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    if (!form.projectId) return;
    setPending(true);
    setError("");
    try {
      await createProjectTask(form.projectId, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      });
      setForm((current) => ({ ...emptyForm, projectId: current.projectId }));
      setNotice("Task created.");
      await applyFilters(taskFilters, 1);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create this task."));
    } finally {
      setPending(false);
    }
  }

  async function handleStatusChange(task, status) {
    setPending(true);
    setError("");
    try {
      const payload = await updateProjectTask(task.project.id, task.id, { status });
      setTasks((current) => current.map((item) => (item.id === task.id ? payload.data.task : item)));
      setNotice("Task status updated.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update task status."));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setPending(true);
    setError("");
    try {
      await deleteProjectTask(task.project.id, task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setNotice("Task deleted.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete this task."));
    } finally {
      setPending(false);
    }
  }

  function beginEdit(task) {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assigneeId: task.assignee?.id || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
    });
  }

  async function handleEditSubmit(event, task, canManageProject) {
    event.preventDefault();
    setPending(true);
    setError("");
    const payload = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      priority: editForm.priority,
      dueDate: editForm.dueDate || null,
    };
    if (canManageProject) payload.assigneeId = editForm.assigneeId || null;
    try {
      const response = await updateProjectTask(task.project.id, task.id, payload);
      setTasks((current) => current.map((item) => item.id === task.id ? response.data.task : item));
      setEditingTaskId("");
      setNotice("Task updated.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update this task."));
    } finally {
      setPending(false);
    }
  }

  async function toggleComments(task) {
    if (openComments === task.id) {
      setOpenComments("");
      return;
    }
    setOpenComments(task.id);
    if (comments[task.id]) return;
    try {
      const payload = await listTaskComments(task.project.id, task.id);
      setComments((current) => ({ ...current, [task.id]: payload.data.items }));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load task comments."));
    }
  }

  async function handleCommentSubmit(event, task) {
    event.preventDefault();
    const body = (commentDrafts[task.id] || "").trim();
    if (!body) return;
    setPending(true);
    setError("");
    try {
      const payload = await createTaskComment(task.project.id, task.id, { body });
      setComments((current) => ({ ...current, [task.id]: [...(current[task.id] || []), payload.data.comment] }));
      setCommentDrafts((current) => ({ ...current, [task.id]: "" }));
      setNotice("Comment added.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to add your comment."));
    } finally {
      setPending(false);
    }
  }

  const selectedProject = projects.find((project) => project.id === form.projectId);

  async function applyFilters(nextFilters = taskFilters, page = 1) {
    setTaskFilters(nextFilters);
    setLoading(true);
    setError("");
    try {
      const payload = await listTasks({
        page,
        limit: 50,
        status: nextFilters.status || undefined,
        priority: nextFilters.priority || undefined,
        assignedToMe: nextFilters.assignedToMe ? "true" : undefined,
      });
      setTasks(payload.data.items);
      setTaskPagination(payload.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load tasks."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">Track project work from planning through completion.</p>
        </div>
      </div>

      {notice ? <p className="mt-4 text-sm text-[var(--accent)]" role="status">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}

      <form className="surface-card mt-6 grid gap-4 p-5 lg:grid-cols-6" onSubmit={handleCreate}>
        <div className="lg:col-span-2">
          <label className="label" htmlFor="task-title">New task</label>
          <input
            id="task-title"
            className="input"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="What needs to be done?"
            minLength={2}
            maxLength={160}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="task-project">Project</label>
          <select
            id="task-project"
            className="input"
            value={form.projectId}
            onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value, assigneeId: "" }))}
            required
          >
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            className="input"
            value={form.priority}
            onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
          >
            {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="task-assignee">Assignee</label>
          <select
            id="task-assignee"
            className="input"
            value={form.assigneeId}
            onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value }))}
          >
            <option value="">Unassigned</option>
            {selectedProject?.members.map((member) => (
              <option key={member.user.id} value={member.user.id}>{member.user.name}</option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="label" htmlFor="task-description">Description</label>
          <input
            id="task-description"
            className="input"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            maxLength={4000}
          />
        </div>
        <div>
          <label className="label" htmlFor="task-due-date">Due date</label>
          <input
            id="task-due-date"
            className="input"
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
          />
        </div>
        <div className="flex items-end lg:col-span-3 lg:justify-end">
          <button className="btn btn-primary w-full sm:w-auto" type="submit" disabled={pending || !projects.length}>
            {pending ? "Saving…" : "Add task"}
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-col gap-3 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <label className="label" htmlFor="task-filter-status">Status</label>
          <select id="task-filter-status" className="input" value={taskFilters.status} onChange={(event) => applyFilters({ ...taskFilters, status: event.target.value })}>
            <option value="">All statuses</option>
            {columns.map((column) => <option key={column.value} value={column.value}>{column.label}</option>)}
          </select>
        </div>
        <div className="sm:w-40">
          <label className="label" htmlFor="task-filter-priority">Priority</label>
          <select id="task-filter-priority" className="input" value={taskFilters.priority} onChange={(event) => applyFilters({ ...taskFilters, priority: event.target.value })}>
            <option value="">All priorities</option>
            {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2 pb-2 text-sm font-medium">
          <input type="checkbox" checked={taskFilters.assignedToMe} onChange={(event) => applyFilters({ ...taskFilters, assignedToMe: event.target.checked })} />
          Assigned to me
        </label>
        {taskPagination?.total > 0 ? <p className="pb-2 text-sm text-[var(--muted)] sm:ml-auto">{taskPagination.total} tasks · page {taskPagination.page} of {taskPagination.pages}</p> : null}
      </div>

      {loading ? (
        <p className="mt-8 text-[var(--muted)]" role="status">Loading tasks…</p>
      ) : projects.length === 0 ? (
        <div className="surface-card mt-6 p-8">
          <p className="font-display text-xl font-semibold">Create a project first</p>
          <p className="mt-2 text-[var(--muted)]">Tasks belong to a project, so create or join one to start organizing work.</p>
        </div>
      ) : (
        <>
        <div className="mt-6 grid gap-4 overflow-x-auto md:grid-cols-2 2xl:grid-cols-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.value);
            return (
              <section key={column.value} className="min-w-[16rem] rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-sm font-semibold">{column.label}</h2>
                  <span className="text-sm text-[var(--muted)]">{columnTasks.length}</span>
                </div>
                <ul className="mt-4 grid content-start gap-3">
                  {columnTasks.map((task) => {
                    const project = projects.find((item) => item.id === task.project.id);
                    const canDelete = ["owner", "admin"].includes(project?.myRole) || task.createdBy?.id === user?.id;
                    const canManageProject = ["owner", "admin"].includes(project?.myRole);
                    const canEdit = canManageProject || task.createdBy?.id === user?.id || task.assignee?.id === user?.id;
                    return (
                      <li key={task.id} className="surface-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-medium capitalize text-[var(--accent)]">
                            {task.priority}
                          </span>
                        </div>
                        {task.description ? <p className="mt-2 text-sm text-[var(--muted)]">{task.description}</p> : null}
                        <p className="mt-3 text-xs text-[var(--muted)]">{task.project.name}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {task.assignee ? `Assigned to ${task.assignee.name}` : "Unassigned"} · Due {formatDate(task.dueDate)}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <label className="sr-only" htmlFor={`task-status-${task.id}`}>Status for {task.title}</label>
                          <select
                            id={`task-status-${task.id}`}
                            className="input min-h-9 py-1 text-sm"
                            value={task.status}
                            disabled={pending}
                            onChange={(event) => handleStatusChange(task, event.target.value)}
                          >
                            {columns.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>
                          <div className="flex gap-2">
                          {canEdit ? (
                            <button
                              type="button"
                              className="btn btn-secondary min-h-9 px-2 py-1 text-sm"
                              disabled={pending}
                              aria-label={`Edit ${task.title}`}
                              onClick={() => editingTaskId === task.id ? setEditingTaskId("") : beginEdit(task)}
                            >
                              {editingTaskId === task.id ? "Close" : "Edit"}
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button type="button" className="btn btn-secondary min-h-9 px-2 py-1 text-sm" disabled={pending} onClick={() => handleDelete(task)}>
                              Delete
                            </button>
                          ) : null}
                          </div>
                        </div>
                        {editingTaskId === task.id ? (
                          <form className="mt-3 grid gap-3 border-t border-[var(--line)] pt-3" onSubmit={(event) => handleEditSubmit(event, task, canManageProject)}>
                            <div>
                              <label className="label" htmlFor={`edit-title-${task.id}`}>Title</label>
                              <input id={`edit-title-${task.id}`} className="input" minLength={2} maxLength={160} value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} required />
                            </div>
                            <div>
                              <label className="label" htmlFor={`edit-description-${task.id}`}>Description</label>
                              <textarea id={`edit-description-${task.id}`} className="input textarea min-h-20" maxLength={4000} value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="label" htmlFor={`edit-priority-${task.id}`}>Priority</label>
                                <select id={`edit-priority-${task.id}`} className="input" value={editForm.priority} onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))}>
                                  {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="label" htmlFor={`edit-due-date-${task.id}`}>Due date</label>
                                <input id={`edit-due-date-${task.id}`} className="input" type="date" value={editForm.dueDate} onChange={(event) => setEditForm((current) => ({ ...current, dueDate: event.target.value }))} />
                              </div>
                            </div>
                            {canManageProject ? (
                              <div>
                                <label className="label" htmlFor={`edit-assignee-${task.id}`}>Assignee</label>
                                <select id={`edit-assignee-${task.id}`} className="input" value={editForm.assigneeId} onChange={(event) => setEditForm((current) => ({ ...current, assigneeId: event.target.value }))}>
                                  <option value="">Unassigned</option>
                                  {project?.members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}
                                </select>
                              </div>
                            ) : null}
                            <button type="submit" className="btn btn-primary justify-self-end" disabled={pending}>{pending ? "Saving…" : "Save task"}</button>
                          </form>
                        ) : null}
                        <button
                          type="button"
                          className="mt-3 text-sm font-semibold text-[var(--accent)] hover:underline"
                          aria-expanded={openComments === task.id}
                          onClick={() => toggleComments(task)}
                        >
                          {openComments === task.id ? "Hide comments" : "Comments"}
                        </button>
                        {openComments === task.id ? (
                          <div className="mt-3 border-t border-[var(--line)] pt-3">
                            <ul className="grid gap-2" aria-label={`Comments for ${task.title}`}>
                              {(comments[task.id] || []).map((comment) => (
                                <li key={comment.id} className="text-sm">
                                  <p className="font-medium">{comment.author.name}</p>
                                  <p className="text-[var(--muted)]">{comment.body}</p>
                                </li>
                              ))}
                              {comments[task.id]?.length === 0 ? (
                                <li className="text-sm text-[var(--muted)]">No comments yet.</li>
                              ) : null}
                            </ul>
                            <form className="mt-3 grid gap-2" onSubmit={(event) => handleCommentSubmit(event, task)}>
                              <label className="sr-only" htmlFor={`comment-${task.id}`}>Add comment to {task.title}</label>
                              <textarea
                                id={`comment-${task.id}`}
                                className="input textarea min-h-20"
                                maxLength={2000}
                                value={commentDrafts[task.id] || ""}
                                onChange={(event) => setCommentDrafts((current) => ({ ...current, [task.id]: event.target.value }))}
                                required
                              />
                              <button className="btn btn-secondary justify-self-end" type="submit" disabled={pending || !(commentDrafts[task.id] || "").trim()}>
                                Comment
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                  {columnTasks.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-[var(--line)] px-3 py-5 text-center text-sm text-[var(--muted)]">
                      No tasks in this column.
                    </li>
                  ) : null}
                </ul>
              </section>
            );
          })}
        </div>
        {taskPagination?.pages > 1 ? (
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" disabled={loading || taskPagination.page <= 1} onClick={() => applyFilters(taskFilters, taskPagination.page - 1)}>Previous tasks</button>
            <button type="button" className="btn btn-secondary" disabled={loading || taskPagination.page >= taskPagination.pages} onClick={() => applyFilters(taskFilters, taskPagination.page + 1)}>Next tasks</button>
          </div>
        ) : null}
        </>
      )}
    </section>
  );
}
