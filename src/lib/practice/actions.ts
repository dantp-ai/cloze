"use server";

import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";
import { resolveSettings } from "@/lib/settings/workspace-settings";
import { review, type Grade } from "@/lib/sr/sm2";
import { checkAnswer } from "@/lib/practice/check";
import { pickDistractors } from "@/lib/practice/distractors";

export type ReviewInput = { cardId: string; input: string; usedHint: boolean };
export type ReviewFeedback = { cardId: string; correct: boolean; answer: string; grade: Grade };

type OwnedCard = Awaited<ReturnType<typeof loadOwnedCard>>;

async function loadOwnedCard(userId: string, cardId: string) {
  return prisma.card.findFirst({
    where: { id: cardId, sentence: { workspace: { userId } } },
    include: { sentence: { include: { workspace: true } } },
  });
}

export async function submitReview(
  inputs: ReviewInput[],
): Promise<{ ok: true; feedback: ReviewFeedback[] } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const feedback: ReviewFeedback[] = [];

  for (const input of inputs) {
    const card = await loadOwnedCard(userId, input.cardId);
    if (!card) return { ok: false, error: "Card not found." };

    const settings = resolveSettings(card.sentence.workspace.settings);
    const correct = checkAnswer(input.input, card.answer, settings.check);
    const grade: Grade = !correct ? "again" : input.usedHint ? "hard" : "good";

    const next = review(
      {
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions,
        lapses: card.lapses,
      },
      grade,
      settings.sr,
      new Date(),
    );

    await prisma.$transaction([
      prisma.card.update({
        where: { id: card.id },
        data: {
          easeFactor: next.easeFactor,
          interval: next.interval,
          repetitions: next.repetitions,
          lapses: next.lapses,
          dueDate: next.dueDate,
          timesSeen: { increment: 1 },
          timesCorrect: { increment: correct ? 1 : 0 },
        },
      }),
      prisma.reviewLog.create({
        data: { cardId: card.id, grade, wasCorrect: correct, usedHint: input.usedHint },
      }),
    ]);

    feedback.push({ cardId: card.id, correct, answer: card.answer, grade });
  }

  return { ok: true, feedback };
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function getCardOptions(
  cardId: string,
): Promise<{ ok: true; options: string[] } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const card: OwnedCard = await loadOwnedCard(userId, cardId);
  if (!card) return { ok: false, error: "Card not found." };

  const others = await prisma.card.findMany({
    where: { sentence: { workspaceId: card.sentence.workspaceId }, id: { not: card.id } },
    select: { answer: true },
  });
  const distractors = pickDistractors(card.answer, others.map((o) => o.answer), 3);
  return { ok: true, options: shuffle([card.answer, ...distractors]) };
}
