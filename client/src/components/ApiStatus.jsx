import { useEffect, useState } from "react";
import { getHealth } from "../lib/api.js";
export default function ApiStatus() {
  const [ok, setOk] = useState(null);
  useEffect(() => {
    getHealth().then(() => setOk(true)).catch(() => setOk(false));
  }, []);
  if (ok === null) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: ok ? "var(--green)" : "var(--red)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: ok ? "var(--green)" : "var(--red)", display: "inline-block" }} />
      {ok ? "Connected" : "Offline"}
    </span>
  );
}
