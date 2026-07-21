"use client";

import { useState } from "react";
import type { PracticeItem } from "@/lib/practice/session";
import { submitReview, getCardOptions, type ReviewFeedback } from "@/lib/practice/actions";

type Props = { items: PracticeItem[] };

export function PracticeRunner({ items }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hinted, setHinted] = useState<Record<string, boolean>>({});
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<ReviewFeedback[] | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">Nothing due right now. Come back later.</p>;
  }

  if (index >= items.length) {
    const total = items.reduce((n, it) => n + it.blanks.length, 0);
    return (
      <p className="text-sm">
        Done. {correctCount} of {total} correct.
      </p>
    );
  }

  const item = items[index];
  const feedbackById = new Map((feedback ?? []).map((f) => [f.cardId, f]));

  async function showHint(cardId: string) {
    const res = await getCardOptions(cardId);
    if (res.ok) {
      setOptions((prev) => ({ ...prev, [cardId]: res.options }));
      setHinted((prev) => ({ ...prev, [cardId]: true }));
    } else {
      setError(res.error);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (feedback) {
      // Advance to the next sentence.
      setFeedback(null);
      setOptions({});
      setIndex((i) => i + 1);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const inputs = item.blanks.map((b) => ({
        cardId: b.cardId,
        input: answers[b.cardId] ?? "",
        usedHint: hinted[b.cardId] ?? false,
      }));
      const res = await submitReview(inputs);
      if (res.ok) {
        setFeedback(res.feedback);
        setCorrectCount((n) => n + res.feedback.filter((f) => f.correct).length);
      } else {
        setError(res.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-neutral-400">
        {index + 1} of {items.length}
      </p>
      <p className="leading-8">
        {item.tokens.map((token, i) => {
          const blank = item.blanks.find((b) => b.tokenIndex === i);
          if (!blank) return <span key={i}>{token.text}</span>;
          const fb = feedbackById.get(blank.cardId);
          return (
            <span key={i} className="inline-flex flex-col items-start align-baseline">
              <input
                aria-label={`blank ${blank.tokenIndex}`}
                value={answers[blank.cardId] ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [blank.cardId]: e.target.value }))
                }
                disabled={!!feedback}
                className={
                  "mx-1 w-28 rounded border-b bg-transparent px-1 text-center outline-none " +
                  (fb
                    ? fb.correct
                      ? "border-green-600 text-green-700"
                      : "border-red-600 text-red-700"
                    : "border-neutral-400")
                }
              />
              {fb && !fb.correct && (
                <span className="mx-1 text-xs text-neutral-500">{fb.answer}</span>
              )}
              {!feedback && (
                <>
                  <button
                    type="button"
                    onClick={() => showHint(blank.cardId)}
                    className="mx-1 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    hint
                  </button>
                  {options[blank.cardId] && (
                    <span className="flex flex-wrap gap-1">
                      {options[blank.cardId].map((opt, i) => (
                        <button
                          key={`${blank.cardId}-${i}`}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [blank.cardId]: opt }))
                          }
                          className="rounded border border-neutral-300 px-1 text-xs dark:border-neutral-700"
                        >
                          {opt}
                        </button>
                      ))}
                    </span>
                  )}
                </>
              )}
            </span>
          );
        })}
      </p>
      {error && <span className="text-sm text-red-600">{error}</span>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {feedback ? "Next" : "Check"}
      </button>
    </form>
  );
}
