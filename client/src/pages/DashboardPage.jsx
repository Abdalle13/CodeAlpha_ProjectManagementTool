import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard, getErrorMessage } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";

const statusLabels = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getDashboard()
      .then((payload) => {
        if (active) setDashboard(payload.data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Unable to load your dashboard."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="text-[var(--muted)]" role="status">Loading your workspace…</p>;
  if (error) return <p className="text-[var(--danger)]" role="alert">{error}</p>;
  if (!dashboard) return null;

  const { metrics, taskStatus, dueSoon } = dashboard;
  const totalStatusTasks = taskStatus.reduce((total, item) => total + item.count, 0);
  const stats = [
    { label: "Projects", value: metrics.totalProjects, detail: "Accessible workspaces" },
    { label: "Assigned to me", value: metrics.assignedToMe, detail: "Open tasks" },
    { label: "In progress", value: metrics.inProgress, detail: "Across your projects" },
    { label: "Completed", value: metrics.completed, detail: "Tasks finished" },
  ];

  return (
    <section>
      <h1 className="page-title">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">A live view of your projects, workload, and upcoming deadlines.</p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-card p-5">
            <dt className="text-sm text-[var(--muted)]">{stat.label}</dt>
            <dd className="mt-2 font-display text-3xl font-bold">{stat.value}</dd>
            <p className="mt-1 text-sm text-[var(--muted)]">{stat.detail}</p>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <section className="surface-card p-5" aria-labelledby="task-progress-heading">
          <h2 id="task-progress-heading" className="font-display text-lg font-semibold">Task progress</h2>
          {totalStatusTasks === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">No tasks to summarize yet.</p>
          ) : (
            <ul className="mt-5 grid gap-4">
              {Object.entries(statusLabels).map(([status, label]) => {
                const count = taskStatus.find((item) => item.status === status)?.count || 0;
                const percentage = Math.round((count / totalStatusTasks) * 100);
                return (
                  <li key={status}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>{label}</span>
                      <span className="text-[var(--muted)]">{count} · {percentage}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]" role="progressbar" aria-label={`${label} tasks`} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${percentage}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span><strong className="text-[var(--danger)]">{metrics.overdue}</strong> overdue</span>
            <span><strong>{metrics.upcoming}</strong> due in 7 days</span>
          </p>
        </section>

        <section className="surface-card p-5" aria-labelledby="due-soon-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="due-soon-heading" className="font-display text-lg font-semibold">Upcoming deadlines</h2>
            <Link className="text-sm font-semibold text-[var(--accent)] hover:underline" to="/tasks">All tasks</Link>
          </div>
          {dueSoon.length ? (
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {dueSoon.map((task) => (
                <li key={task.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-[var(--muted)]">{task.project?.name || "Project"}{task.assignee ? ` · ${task.assignee.name}` : " · Unassigned"}</p>
                  </div>
                  <time className="text-sm text-[var(--muted)]" dateTime={task.dueDate}>{formatDate(task.dueDate)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">No outstanding tasks have due dates.</p>
          )}
        </section>
      </div>

      {metrics.totalProjects === 0 ? (
        <div className="mt-6 border-t border-[var(--line)] pt-5">
          <p className="font-display text-lg font-semibold">Start with a project</p>
          <p className="mt-1 text-[var(--muted)]">Create or join a workspace to plan tasks with your team.</p>
          <Link className="btn btn-primary mt-4" to="/projects">Go to projects</Link>
        </div>
      ) : null}
    </section>
  );
}
