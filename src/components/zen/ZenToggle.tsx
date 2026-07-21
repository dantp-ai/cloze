"use client";

import { useZen } from "./ZenProvider";

export function ZenToggle() {
  const { zen, toggle } = useZen();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={zen}
      aria-label="Zen mode"
      title="Zen mode"
      className="rounded-md p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
    >
      {"⛶"}
    </button>
  );
}
