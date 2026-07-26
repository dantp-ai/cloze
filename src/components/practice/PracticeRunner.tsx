"use client";

import { useEffect, useRef, useState } from "react";
import type { PracticeItem } from "@/lib/practice/session";
import { submitReview, getCardOptions, type ReviewFeedback } from "@/lib/practice/actions";
import { getTranslation } from "@/lib/translate/actions";

type Props = {
  items: PracticeItem[];
  translationLang?: string | null;
  translationCountsAsHint?: boolean;
};

// Card ids of a sentence's blanks in reading (left-to-right) order.
function orderedCardIds(item: PracticeItem): string[] {
  return [...item.blanks].sort((a, b) => a.tokenIndex - b.tokenIndex).map((b) => b.cardId);
}

export function PracticeRunner({
  items,
  translationLang = null,
  translationCountsAsHint = false,
}: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hinted, setHinted] = useState<Record<string, boolean>>({});
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<ReviewFeedback[] | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translation of the current sentence, fetched on demand and cached by
  // sentenceId. Shown under the masked sentence as an aid.
  const [tData, setTData] = useState<Record<string, { text: string | null }>>({});
  const [tError, setTError] = useState<Record<string, string>>({});
  const [tLoading, setTLoading] = useState<Record<string, boolean>>({});
  const requested = useRef<Set<string>>(new Set());

  const sid = index < items.length ? items[index].sentenceId : undefined;

  useEffect(() => {
    if (!translationLang || !sid || requested.current.has(sid)) return;
    requested.current.add(sid);
    setTLoading((prev) => ({ ...prev, [sid]: true }));
    getTranslation(sid, translationLang)
      .then((res) => {
        if (res.ok) setTData((prev) => ({ ...prev, [sid]: { text: res.text } }));
        else setTError((prev) => ({ ...prev, [sid]: res.error }));
      })
      .finally(() => setTLoading((prev) => ({ ...prev, [sid]: false })));
  }, [translationLang, sid]);

  // Blinking caret on the first masked word of each card.
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const firstCardId = index < items.length ? orderedCardIds(items[index])[0] : undefined;
  useEffect(() => {
    if (firstCardId) inputRefs.current[firstCardId]?.focus();
  }, [index, firstCardId]);

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

  // Text of the translation aid shown under the current sentence.
  const translation = tData[item.sentenceId];
  const translationLine = tError[item.sentenceId]
    ? tError[item.sentenceId]
    : !translation
      ? "Translating…"
      : translation.text
        ? `${translationLang}: ${translation.text}`
        : "No translation available";

  const cardIds = orderedCardIds(item);
  function onBlankKeyDown(e: React.KeyboardEvent<HTMLInputElement>, cardId: string) {
    // Cmd + Left/Right jumps between masked words (plain arrows move the caret).
    if (e.metaKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const pos = cardIds.indexOf(cardId);
      const nextPos =
        e.key === "ArrowRight" ? Math.min(pos + 1, cardIds.length - 1) : Math.max(pos - 1, 0);
      inputRefs.current[cardIds[nextPos]]?.focus();
      return;
    }
    // "?" reveals the hint. It is never part of a cloze answer, so it can trigger
    // at any time without blocking any typed letters (Shift is allowed - "?" needs it).
    if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      showHint(cardId);
    }
  }

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
      const translationShown = !!tData[item.sentenceId]?.text;
      const inputs = item.blanks.map((b) => ({
        cardId: b.cardId,
        input: answers[b.cardId] ?? "",
        usedHint: (hinted[b.cardId] ?? false) || (translationCountsAsHint && translationShown),
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
                ref={(el) => {
                  inputRefs.current[blank.cardId] = el;
                }}
                aria-label={`blank ${blank.tokenIndex}`}
                value={answers[blank.cardId] ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [blank.cardId]: e.target.value }))
                }
                onKeyDown={(e) => onBlankKeyDown(e, blank.cardId)}
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
      {translationLang && <p className="text-sm text-neutral-500">{translationLine}</p>}
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
