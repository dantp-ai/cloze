"use client";

import type { Token } from "@/lib/text/tokenize";

export function TokenMasker({
  tokens,
  masked,
  onChange,
}: {
  tokens: Token[];
  masked: number[];
  onChange: (indices: number[]) => void;
}) {
  function toggle(index: number) {
    const set = new Set(masked);
    if (set.has(index)) set.delete(index);
    else set.add(index);
    onChange(Array.from(set).sort((a, b) => a - b));
  }

  return (
    <p className="rounded-md border border-neutral-200 p-3 leading-8 dark:border-neutral-800">
      {tokens.map((token, index) =>
        token.maskable ? (
          <button
            key={index}
            type="button"
            aria-pressed={masked.includes(index)}
            onClick={() => toggle(index)}
            className={
              "rounded px-0.5 " +
              (masked.includes(index)
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800")
            }
          >
            {token.text}
          </button>
        ) : (
          <span key={index} className="whitespace-pre-wrap">
            {token.text}
          </span>
        ),
      )}
    </p>
  );
}
