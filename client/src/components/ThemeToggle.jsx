import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn btn-secondary min-h-10 px-3"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
