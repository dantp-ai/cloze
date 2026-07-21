"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { tokenize } from "@/lib/text/tokenize";
import { createSentence, updateSentence } from "@/lib/sentence/actions";
import { createTopic } from "@/lib/topic/actions";
import { TokenMasker } from "./TokenMasker";

type Props = {
  workspaceId: string;
  translationLangs: string[];
  topics: { id: string; name: string }[];
  mode: "create" | "edit";
  sentenceId?: string;
  initial?: {
    text: string;
    maskedIndices: number[];
    topicId: string | null;
    translations: Record<string, string>;
  };
};

export function SentenceForm({
  workspaceId,
  translationLangs,
  topics,
  mode,
  sentenceId,
  initial,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState(initial?.text ?? "");
  const [masked, setMasked] = useState<number[]>(initial?.maskedIndices ?? []);
  const [topicId, setTopicId] = useState<string>(initial?.topicId ?? "");
  const [translations, setTranslations] = useState<Record<string, string>>(initial?.translations ?? {});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [topicError, setTopicError] = useState<string | null>(null);
  const [addingTopic, setAddingTopic] = useState(false);

  const tokens = useMemo(() => tokenize(text), [text]);

  function onTextChange(next: string) {
    setText(next);
    // Drop any masked index that is no longer a maskable token in the new text.
    const nextTokens = tokenize(next);
    setMasked((prev) => prev.filter((i) => nextTokens[i]?.maskable));
  }

  async function onAddTopic() {
    const name = newTopic.trim();
    if (!name) return;
    setTopicError(null);
    setAddingTopic(true);
    try {
      const res = await createTopic(workspaceId, name);
      if (res.ok) {
        setTopicId(res.id);
        setNewTopic("");
        router.refresh();
      } else {
        setTopicError(res.error);
      }
    } catch {
      setTopicError("Could not add topic.");
    } finally {
      setAddingTopic(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const payload = {
      workspaceId,
      topicId: topicId || null,
      text,
      maskedIndices: masked,
      translations: translationLangs.map((lang) => ({ lang, text: translations[lang] ?? "" })),
    };
    try {
      const res =
        mode === "edit" && sentenceId
          ? await updateSentence(sentenceId, payload)
          : await createSentence(payload);
      if (res.ok) {
        router.push("/browse");
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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label htmlFor="sentence-text" className="text-sm text-neutral-500">
        Sentence
      </label>
      <textarea
        id="sentence-text"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={2}
        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700"
      />

      {tokens.some((t) => t.maskable) && (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-neutral-500">Tap words to mask</span>
          <TokenMasker tokens={tokens} masked={masked} onChange={setMasked} />
        </div>
      )}

      <label htmlFor="topic" className="text-sm text-neutral-500">
        Topic
      </label>
      <select
        id="topic"
        value={topicId}
        onChange={(e) => setTopicId(e.target.value)}
        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
      >
        <option value="">No topic</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="New topic"
          aria-label="New topic name"
          className="flex-1 rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
        />
        <button
          type="button"
          onClick={onAddTopic}
          disabled={addingTopic || newTopic.trim().length === 0}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
        >
          Add topic
        </button>
      </div>
      {topicError && <p className="text-sm text-red-600">{topicError}</p>}

      {translationLangs.map((lang) => (
        <div key={lang} className="flex flex-col gap-1">
          <label htmlFor={`tr-${lang}`} className="text-sm text-neutral-500">
            Translation ({lang})
          </label>
          <input
            id={`tr-${lang}`}
            value={translations[lang] ?? ""}
            onChange={(e) => setTranslations((prev) => ({ ...prev, [lang]: e.target.value }))}
            className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700"
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {mode === "edit" ? "Save changes" : "Save sentence"}
      </button>
    </form>
  );
}
