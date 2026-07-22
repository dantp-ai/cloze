"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/lib/workspace/actions";
import { LanguageCombobox } from "@/components/lang/LanguageCombobox";
import { ALL_LANGUAGES, COMMON_LANG_CODES, languageLabel } from "@/lib/lang/languages";

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

  const extraLangs = translationLangs.filter((code) => !COMMON_LANG_CODES.includes(code));

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

      <span className="text-sm text-neutral-500">Learning</span>
      <div>
        <LanguageCombobox
          languages={ALL_LANGUAGES}
          value={learningLang}
          onSelect={setLearningLang}
          ariaLabel="Learning language"
        />
      </div>

      <span id="ws-translate-label" className="text-sm text-neutral-500">Translate to</span>
      <div role="group" aria-labelledby="ws-translate-label" className="flex flex-wrap items-center gap-2">
        {COMMON_LANG_CODES.map((code) => (
          <button
            type="button"
            key={code}
            onClick={() => toggleTranslation(code)}
            aria-pressed={translationLangs.includes(code)}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (translationLangs.includes(code)
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                : "border-neutral-300 dark:border-neutral-700")
            }
          >
            {languageLabel(code)}
          </button>
        ))}
        {extraLangs.map((code) => (
          <span
            key={code}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-neutral-900 px-3 py-1 text-sm text-white dark:border-white dark:bg-white dark:text-neutral-900"
          >
            {languageLabel(code)}
            <button
              type="button"
              onClick={() => toggleTranslation(code)}
              aria-label={`Remove ${languageLabel(code)}`}
              className="text-xs leading-none"
            >
              {"×"}
            </button>
          </span>
        ))}
        <LanguageCombobox
          languages={ALL_LANGUAGES}
          triggerLabel="＋ Add language"
          exclude={[...COMMON_LANG_CODES, ...translationLangs]}
          onSelect={toggleTranslation}
        />
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
