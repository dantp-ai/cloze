"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/lib/workspace/actions";

const LANGS = [
  { code: "it", label: "Italian" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "en", label: "English" },
];

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [learningLang, setLearningLang] = useState("it");
  const [translationLangs, setTranslationLangs] = useState<string[]>(["en"]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggleTranslation(code: string) {
    setTranslationLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await createWorkspace({ name, learningLang, translationLangs });
      if (res.ok) {
        setName("");
        router.refresh();
      } else {
        setError(res.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workspace name (e.g. Italian)"
        aria-label="Workspace name"
        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700"
      />
      <label htmlFor="ws-learning" className="text-sm text-neutral-500">Learning</label>
      <select
        id="ws-learning"
        value={learningLang}
        onChange={(e) => setLearningLang(e.target.value)}
        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
      <label id="ws-translate-label" className="text-sm text-neutral-500">Translate to</label>
      <div role="group" aria-labelledby="ws-translate-label" className="flex flex-wrap gap-2">
        {LANGS.map((l) => (
          <button
            type="button"
            key={l.code}
            onClick={() => toggleTranslation(l.code)}
            aria-pressed={translationLangs.includes(l.code)}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (translationLangs.includes(l.code)
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                : "border-neutral-300 dark:border-neutral-700")
            }
          >
            {l.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        Create workspace
      </button>
    </form>
  );
}
