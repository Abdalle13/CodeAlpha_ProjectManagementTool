import { useEffect, useState } from "react";
import { listTeamMembers, getErrorMessage } from "../lib/api.js";
import { Avatar } from "../layouts/AppLayout.jsx";

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    let active = true;
    listTeamMembers()
      .then(res => { if (active) setMembers(res.data.items); })
      .catch(err => { if (active) setError(getErrorMessage(err, "Failed to load team members.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = members.filter(m => {
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole   = !roleFilter || (roleFilter === "admin" ? m.systemRole === "admin" : m.systemRole !== "admin");
    return matchesSearch && matchesRole;
  });

  return (
    <section className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        <div>
          <h1 className="page-title">Project Members</h1>
          <p style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            Teammates and collaborators participating in your active projects.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: "0.875rem 1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.5rem" }}>
        <input
          className="input"
          style={{ maxWidth: "20rem" }}
          placeholder="Search member by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input" style={{ width: "auto" }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="member">Members</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: "0.8125rem", color: "var(--muted)" }}>
          {filtered.length} member{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 17rem), 1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: "10rem", borderRadius: "12px" }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: "1.5rem", borderRadius: "12px", background: "var(--red-soft)", color: "var(--red)" }}>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "2.5rem", textAlign: "center", color: "var(--muted)" }}>
          No project members found matching your search.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 17rem), 1fr))", gap: "1rem" }}>
          {filtered.map(m => (
            <div key={m.id} className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <Avatar name={m.name} size={46} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.name}
                  </p>
                  <p style={{ margin: "0.15rem 0 0", color: "var(--muted)", fontSize: "0.775rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.email}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                <span className={"badge " + (m.systemRole === "admin" ? "badge-purple" : "badge-blue")}>
                  {m.systemRole === "admin" ? "Administrator" : "Member"}
                </span>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "var(--muted)" }}>
                <span>Active tasks</span>
                <span style={{ fontWeight: 700, color: "var(--ink)" }}>{m.activeTasksCount ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
