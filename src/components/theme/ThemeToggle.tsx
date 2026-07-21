"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
      className="rounded-md p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
