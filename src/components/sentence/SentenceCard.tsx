"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteSentence } from "@/lib/sentence/actions";
import { HoverTranslate } from "@/components/translate/HoverTranslate";

export type SentenceCardData = {
  id: string;
  preview: string;
  translations: { lang: string; text: string }[];
};

export function SentenceCard({ sentence, lang }: { sentence: SentenceCardData; lang: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function onDelete() {
    setPending(true);
    setError(false);
    try {
      await deleteSentence(sentence.id);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="flex flex-col gap-1">
        {lang ? (
          <HoverTranslate sentenceId={sentence.id} lang={lang}>
            <span className="font-mono text-sm">{sentence.preview}</span>
          </HoverTranslate>
        ) : (
          <span className="font-mono text-sm">{sentence.preview}</span>
        )}
        {sentence.translations.map((t) => (
          <span key={t.lang} className="text-xs text-neutral-500">
            {t.lang}: {t.text}
          </span>
        ))}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 text-sm">
        <div className="flex gap-2">
          <Link href={`/browse/${sentence.id}/edit`} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
            Edit
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="text-neutral-500 hover:text-red-600 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
        {error && <span className="text-xs text-red-600">Delete failed</span>}
      </div>
    </div>
  );
}
