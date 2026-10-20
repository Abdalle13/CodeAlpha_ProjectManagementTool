import { useEffect, useState } from "react";
import { getHealth } from "../lib/api.js";

export default function ApiStatus() {
  const [state, setState] = useState({ status: "loading", label: "Checking API" });

  useEffect(() => {
    let active = true;

    getHealth()
      .then((payload) => {
        if (!active) return;
        const database = payload?.data?.database ?? "unknown";
        setState({
          status: "ok",
          label: `API online · database ${database}`,
        });
      })
      .catch(() => {
        if (!active) return;
        setState({ status: "error", label: "API unreachable" });
      });

    return () => {
      active = false;
    };
  }, []);

  const tone =
    state.status === "ok"
      ? "text-[var(--accent)]"
      : state.status === "error"
        ? "text-[var(--danger)]"
        : "text-[var(--muted)]";

  return (
    <p className={`text-sm ${tone}`} role="status">
      {state.label}
    </p>
  );
}
