"use client";

import { useId } from "react";

// Accessible info tooltip: a small "?" button that reveals a definition on
// hover and on keyboard focus (pure CSS via group-hover / group-focus-within,
// so no client state is needed). The button carries a generic accessible name
// and points at the tooltip text through aria-describedby.
export function FieldTooltip({ text }: { text: string }) {
  const tooltipId = useId();
  return (
    <span className="group relative inline-flex items-center">
      <button
        type="button"
        aria-label="More info"
        aria-describedby={tooltipId}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[10px] font-semibold leading-none text-neutral-500 transition-colors hover:border-neutral-500 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:text-neutral-400 dark:hover:border-neutral-400 dark:hover:text-neutral-200"
      >
        ?
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-10 mt-1.5 w-56 rounded-md bg-neutral-900 px-2.5 py-2 text-xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {text}
      </span>
    </span>
  );
}
