"use client";

import { useZen } from "@/components/zen/ZenProvider";

export function ShellFrame({
  rail,
  topBar,
  children,
}: {
  rail: React.ReactNode;
  topBar: React.ReactNode;
  children: React.ReactNode;
}) {
  const { zen, exit } = useZen();
  return (
    <div className="flex min-h-screen">
      {!zen && rail}
      <div className="flex min-w-0 flex-1 flex-col">
        {!zen && topBar}
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">{children}</main>
      </div>
      {zen && (
        <button
          type="button"
          onClick={exit}
          aria-label="Exit zen"
          title="Exit zen (Esc)"
          className="fixed right-4 top-4 rounded-md p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          {"×"}
        </button>
      )}
    </div>
  );
}
