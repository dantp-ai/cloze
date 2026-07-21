"use client";

import { useState } from "react";
import { startPractice } from "@/lib/practice/start";
import type { PracticeItem } from "@/lib/practice/session";
import { PracticeRunner } from "./PracticeRunner";

type Props = { workspaceId: string; topics: { id: string; name: string }[] };

export function PracticeSetup({ workspaceId, topics }: Props) {
  const [scope, setScope] = useState<string>(""); // "" = whole workspace
  const [items, setItems] = useState<PracticeItem[] | null>(null);
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    try {
      const session = await startPractice(workspaceId, scope ? { topicId: scope } : {});
      setItems(session);
    } finally {
      setPending(false);
    }
  }

  if (items) return <PracticeRunner items={items} />;

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="scope" className="text-sm text-neutral-500">
        Practice scope
      </label>
      <select
        id="scope"
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
      >
        <option value="">Whole workspace (random)</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        Start practice
      </button>
    </div>
  );
}
