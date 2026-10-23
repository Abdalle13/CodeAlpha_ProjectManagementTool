import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { getErrorMessage } from "../lib/api.js";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError("All fields are required."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setPending(true); setError("");
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create your account."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Get started with Taskora." switchText="Already have an account?" switchTo="/login" switchLabel="Sign in">
      <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: "0.875rem" }}>
        <div>
          <label className="label" htmlFor="reg-name">Full name</label>
          <input id="reg-name" className="input input-lg" autoComplete="name" placeholder="Jane Smith" value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <label className="label" htmlFor="reg-email">Email address</label>
          <input id="reg-email" className="input input-lg" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
        </div>
        <div>
          <label className="label" htmlFor="reg-pass">Password</label>
          <input id="reg-pass" className="input input-lg" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={set("password")} required minLength={8} />
        </div>
        {error && <p role="alert" style={{ margin: 0, fontSize: "0.8125rem", color: "var(--red)" }}>{error}</p>}
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "0.25rem" }} disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
