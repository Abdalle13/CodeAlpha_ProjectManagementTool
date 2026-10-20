import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { getErrorMessage } from "../lib/api.js";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name || !email || password.length < 8) {
      setError("Enter your name, email, and a password of at least 8 characters.");
      return;
    }

    setPending(true);
    setError("");
    try {
      await register({ name, email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create this account."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create your Taskora account"
      subtitle="Set up a workspace account to start planning projects with your team."
      switchText="Already have an account?"
      switchTo="/login"
      switchLabel="Sign in"
    >
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            className="input"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn btn-primary mt-2" type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
