"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { languageLabel } from "@/lib/lang/languages";

type Language = { code: string; label: string };

type Props = {
  languages: Language[];
  value?: string;
  triggerLabel?: string;
  exclude?: string[];
  onSelect: (code: string) => void;
  ariaLabel?: string;
};

export function LanguageCombobox({
  languages,
  value,
  triggerLabel,
  exclude = [],
  onSelect,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const excluded = useMemo(() => new Set(exclude), [exclude]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return languages.filter((l) => {
      if (excluded.has(l.code)) return false;
      if (!q) return true;
      return l.label.toLowerCase().includes(q) || l.code.toLowerCase().startsWith(q);
    });
  }, [languages, excluded, query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function choose(code: string) {
    onSelect(code);
    setOpen(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[active];
      if (opt) choose(opt.code);
    }
  }

  const label = triggerLabel ?? (value ? languageLabel(value) : "Select language");

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex items-center gap-1 rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
      >
        {label} <span aria-hidden>{"▾"}</span>
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-1 w-64 rounded-md border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search languages"
            aria-label="Search languages"
            className="mb-1 w-full rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
          />
          <ul role="listbox" className="max-h-60 overflow-auto">
            {options.length === 0 ? (
              <li className="px-2 py-1.5 text-sm text-neutral-400">No matches</li>
            ) : (
              options.map((l, i) => (
                <li key={l.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onClick={() => choose(l.code)}
                    onMouseEnter={() => setActive(i)}
                    className={
                      "block w-full rounded px-2 py-1.5 text-left text-sm " +
                      (i === active ? "bg-neutral-100 dark:bg-neutral-800" : "")
                    }
                  >
                    {l.label}
                    <span className="ml-2 text-xs text-neutral-400">{l.code}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
