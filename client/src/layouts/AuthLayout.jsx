import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function AuthLayout({ children, title, subtitle, switchText, switchTo, switchLabel }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between border-r border-[var(--line)] bg-[var(--bg-accent)] px-10 py-8 lg:flex">
          <BrandMark />
          <div className="max-w-md">
            <p className="font-display text-4xl font-bold tracking-[-0.05em] leading-tight">
              Plan projects. Manage tasks. Work together.
            </p>
            <p className="mt-5 text-lg text-[var(--muted)]">
              Taskora is a workspace for teams that need a clear view of projects, owners, and progress.
            </p>
          </div>
          <p className="text-sm text-[var(--muted)]">Internship project for CodeAlpha Full Stack Development.</p>
        </section>

        <section className="flex flex-col px-5 py-6 sm:px-8">
          <header className="mb-8 flex items-center justify-between lg:justify-end">
            <div className="lg:hidden">
              <BrandMark compact />
            </div>
            <ThemeToggle />
          </header>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-10">
            <h1 className="page-title">{title}</h1>
            <p className="mt-2 text-[var(--muted)]">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-8 text-sm text-[var(--muted)]">
              {switchText}{" "}
              <Link className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline" to={switchTo}>
                {switchLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
