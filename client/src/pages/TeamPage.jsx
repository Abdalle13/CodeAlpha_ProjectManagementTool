import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTeamMembers, listProjects, getErrorMessage } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Avatar } from "../layouts/AppLayout.jsx";
import Toast from "../components/Toast.jsx";

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.systemRole === "admin" || currentUser?.role === "admin";

  const [members, setMembers]   = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      listTeamMembers(),
      listProjects({ limit: 50 }).catch(() => ({ data: { items: [] } })),
    ])
      .then(([memRes, projRes]) => {
        if (!active) return;
        setMembers(memRes.data.items || []);
        setProjects(projRes.data.items || []);
      })
      .catch(err => {
        if (active) setError(getErrorMessage(err, "Failed to load project members."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Map each member to their associated projects
  const memberProjectsMap = members.reduce((acc, m) => {
    const memberId = String(m.id || m._id || "");
    const projs = projects.filter(p => {
      const isOwner = String(p.owner?.id || p.owner?._id || p.owner || "") === memberId;
      const isMember = (p.members || []).some(
        mem => String(mem.user?.id || mem.user?._id || mem.user || "") === memberId
      );
      return isOwner || isMember;
    });
    acc[memberId] = projs;
    return acc;
  }, {});

  const filtered = members.filter(m => {
    // Protect system users: if current user is not an admin, hide system administrators unless it's yourself
    const isMemberAdmin = m.systemRole === "admin" || m.role === "admin";
    if (!isAdmin && isMemberAdmin && String(m.id) !== String(currentUser?.id)) {
      return false;
    }

    const matchesSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());

    const memberId = String(m.id || m._id || "");
    const assignedProjects = memberProjectsMap[memberId] || [];

    const matchesProject = !projectFilter || assignedProjects.some(p => String(p.id) === projectFilter);

    return matchesSearch && matchesProject;
  });

  return (
    <section className="fade-in">
      <Toast message={error} type="error" onClose={() => setError("")} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        <div>
          <h1 className="page-title">Project Members</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            Teammates and collaborators participating across your workspace initiatives.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: "0.875rem 1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", flex: "1 1 20rem" }}>
          <input
            className="input"
            style={{ flex: "1 1 14rem", minWidth: 0 }}
            placeholder="Search member by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {projects.length > 0 && (
            <select
              className="input"
              style={{ flex: "0 1 auto", minWidth: "9.5rem" }}
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        <span style={{ fontSize: "0.8125rem", color: "var(--muted)", fontWeight: 600, marginLeft: "auto" }}>
          {filtered.length} member{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 18rem), 1fr))", gap: "1.25rem" }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: "12rem", borderRadius: "12px" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
          No project members found matching your search.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 19rem), 1fr))", gap: "1.25rem" }}>
          {[...filtered].sort((a, b) => {
            const aIsMe = String(a.id || a._id) === String(currentUser?.id);
            const bIsMe = String(b.id || b._id) === String(currentUser?.id);
            return aIsMe ? -1 : bIsMe ? 1 : 0;
          }).map(m => {
            const memberId = String(m.id || m._id || "");
            const assignedProjects = memberProjectsMap[memberId] || [];
            const isMe = memberId === String(currentUser?.id);

            return (
              <div
                key={memberId}
                className="card card-hover"
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: "12px",
                  gap: "1rem",
                  ...(isMe ? { border: "1.5px solid var(--accent)", boxShadow: "0 0 0 3px var(--accent-soft)" } : {}),
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.875rem" }}>
                    <Avatar name={m.name} size={46} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.name}
                        </p>
                        {isMe && (
                          <span style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "1px 7px",
                            borderRadius: "999px",
                            background: "var(--accent)",
                            color: "#fff",
                            letterSpacing: "0.03em",
                            flexShrink: 0,
                          }}>You</span>
                        )}
                      </div>
                      <p style={{ margin: "0.15rem 0 0", color: "var(--muted)", fontSize: "0.775rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.email}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.875rem" }}>
                    <span className={"badge " + (m.systemRole === "admin" ? "badge-purple" : "badge-blue")}>
                      {m.systemRole === "admin" ? "Administrator" : "Team Member"}
                    </span>
                  </div>

                  {/* Associated Projects */}
                  <div>
                    <span style={{ fontSize: "0.725rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.35rem" }}>
                      Projects ({assignedProjects.length})
                    </span>
                    {assignedProjects.length === 0 ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>No assigned projects yet</span>
                    ) : (
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {assignedProjects.slice(0, 3).map(p => (
                          <Link
                            key={p.id}
                            to={`/projects/${p.id}`}
                            style={{
                              fontSize: "0.725rem",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              background: "var(--accent-soft)",
                              color: "var(--accent)",
                              textDecoration: "none",
                              fontWeight: 600,
                              maxWidth: "12rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.name}
                          </Link>
                        ))}
                        {assignedProjects.length > 3 && (
                          <span style={{ fontSize: "0.725rem", color: "var(--muted)", padding: "2px 4px" }}>
                            +{assignedProjects.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "var(--muted)" }}>
                  <span>Active tasks</span>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>{m.activeTasksCount ?? 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
