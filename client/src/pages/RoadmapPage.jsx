import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProjects, getErrorMessage } from "../lib/api.js";
import { formatDate } from "../lib/projects.js";

const STATUS_COLOR = {
  active: "#4f6ef7",
  planning: "#d97c10",
  paused: "#8b95ab",
  completed: "#17a55e",
};

export default function RoadmapPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    let active = true;
    listProjects({ limit: 50 })
      .then(res => { if (active) setProjects(res.data.items); })
      .catch(err => { if (active) setError(getErrorMessage(err, "Failed to load roadmap.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        <div>
          <h1 className="page-title">Roadmap & Timeline</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            High-level visual schedule of active initiatives, sprint milestones, and deliverables.
          </p>
        </div>
        <Link to="/projects" className="btn btn-primary">Manage projects</Link>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: "6rem", borderRadius: "12px" }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: "1.5rem", borderRadius: "12px", background: "var(--red-soft)", color: "var(--red)" }}>
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
          <p style={{ fontWeight: 600, margin: "0 0 0.5rem" }}>No roadmap projects found</p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>
            Add projects with start and target completion dates to populate your roadmap.
          </p>
          <Link to="/projects" className="btn btn-primary">Create a project</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {/* Timeline header preview */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink)" }}>Initiative Schedule</span>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR.active }} /> Active
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR.planning }} /> Planning
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR.completed }} /> Completed
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gap: "1.25rem" }}>
              {projects.map(proj => {
                const color = STATUS_COLOR[proj.status] || "var(--accent)";
                return (
                  <div
                    key={proj.id}
                    style={{
                      padding: "1.25rem",
                      borderRadius: "10px",
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      transition: "all 150ms ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--accent)" }}>{proj.key}</span>
                          <Link to={"/projects/" + proj.id} style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink)", textDecoration: "none" }}>
                            {proj.name}
                          </Link>
                        </div>
                        {proj.description && (
                          <p style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem", color: "var(--muted)", maxWidth: "45rem", lineHeight: 1.4 }}>
                            {proj.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span className={"badge " + (proj.status === "active" ? "badge-blue" : proj.status === "completed" ? "badge-green" : "badge-yellow")}>
                          {proj.status}
                        </span>
                        <span className="badge badge-gray">{proj.category}</span>
                      </div>
                    </div>

                    {/* Timeline bar */}
                    <div style={{ marginTop: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.35rem" }}>
                        <span>Start: {proj.startDate ? formatDate(proj.startDate) : "Immediate"}</span>
                        <span>Target Deadline: {proj.dueDate ? formatDate(proj.dueDate) : "Continuous"}</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: proj.status === "completed" ? "100%" : proj.status === "active" ? "65%" : "25%",
                            height: "100%",
                            background: color,
                            borderRadius: "99px",
                            transition: "width 500ms ease",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
