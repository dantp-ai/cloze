"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { readZenDefault, writeZenDefault } from "@/lib/appearance/zen-preference";

export function AppearanceSettings() {
  const { theme, toggle } = useTheme();
  const [zenDefault, setZenDefault] = useState(false);

  // Read after mount so the server-rendered markup and the first client render agree.
  useEffect(() => {
    setZenDefault(readZenDefault());
  }, []);

  function onZenDefaultChange(next: boolean) {
    setZenDefault(next);
    writeZenDefault(next);
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-neutral-500">Appearance</h2>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm">Theme</span>
        <button
          type="button"
          onClick={toggle}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
        >
          {theme === "dark" ? "Dark" : "Light"}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={zenDefault}
          onChange={(e) => onZenDefaultChange(e.target.checked)}
        />
        Start in zen mode
      </label>
    </section>
  );
}
