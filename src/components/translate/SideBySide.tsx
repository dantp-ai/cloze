"use client";

import { useState } from "react";
import { getTranslation } from "@/lib/translate/actions";

type Row = { id: string; text: string; translations: Record<string, string> };

export function SideBySide({ langs, rows }: { langs: string[]; rows: Row[] }) {
  const [lang, setLang] = useState(langs[0] ?? "");
  const [fetched, setFetched] = useState<Record<string, string>>({}); // key: `${id}:${lang}`
  const [pending, setPending] = useState<string | null>(null);

  async function translate(id: string) {
    const key = `${id}:${lang}`;
    setPending(key);
    try {
      const res = await getTranslation(id, lang);
      if (res.ok) setFetched((prev) => ({ ...prev, [key]: res.text ?? "No translation" }));
    } finally {
      setPending(null);
    }
  }

  if (langs.length === 0) {
    return <p className="text-sm text-neutral-500">This workspace has no translation languages.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {langs.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={l === lang}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (l === lang
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                : "border-neutral-300 dark:border-neutral-700")
            }
          >
            {l}
          </button>
        ))}
      </div>

      <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
        {rows.map((row) => {
          const key = `${row.id}:${lang}`;
          const translation = row.translations[lang] ?? fetched[key];
          return (
            <li key={row.id} className="grid grid-cols-2 gap-4 py-3">
              <span className="text-sm">{row.text}</span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {translation ?? (
                  <button
                    type="button"
                    onClick={() => translate(row.id)}
                    disabled={pending === key}
                    className="text-neutral-500 underline disabled:opacity-50"
                  >
                    {pending === key ? "Translating..." : "Translate"}
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
