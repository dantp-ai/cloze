"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { switchWorkspace } from "@/lib/workspace/actions";
import type { WorkspaceLite } from "@/types/workspace";

export function WorkspaceSwitcher({
  workspaces,
  activeId,
}: {
  workspaces: WorkspaceLite[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  if (workspaces.length === 0) return null;

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  async function choose(id: string) {
    setOpen(false);
    if (id !== active.id) {
      await switchWorkspace(id);
      router.refresh();
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        {active.name} {"▾"}
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 z-10 mt-1 min-w-40 rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        >
          {workspaces.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                role="menuitem"
                onClick={() => choose(w.id)}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {w.name}
                <span className="ml-2 text-xs text-neutral-400">
                  {w.learningLang} {"→"} {w.translationLangs.join("/")}
                </span>
              </button>
            </li>
          ))}
          <li role="separator" className="my-1 border-t border-neutral-200 dark:border-neutral-800" />
          <li>
            <Link
              href="/workspaces"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {"＋"} New workspace
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
