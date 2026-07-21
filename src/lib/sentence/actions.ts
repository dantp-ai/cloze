"use server";

import { prisma } from "@/lib/db";
import { type SentenceInput, prepareSentenceWrite } from "@/lib/sentence/prepare";
import { requireUserId } from "@/lib/auth/guard";
import { getSentenceForUser } from "@/lib/sentence/queries";

export type SentenceResult = { ok: true; id: string } | { ok: false; error: string };

export async function createSentence(input: SentenceInput): Promise<SentenceResult> {
  const prepared = await prepareSentenceWrite(input);
  if (!prepared.ok) return prepared;

  const sentence = await prisma.sentence.create({
    data: {
      workspaceId: input.workspaceId,
      topicId: prepared.topicId,
      text: prepared.text,
      tokens: prepared.tokens,
      cards: { create: prepared.cardSeeds },
      translations: { create: prepared.translations },
    },
  });
  return { ok: true, id: sentence.id };
}

export async function updateSentence(
  sentenceId: string,
  input: SentenceInput,
): Promise<SentenceResult> {
  const userId = await requireUserId();
  const existing = await getSentenceForUser(userId, sentenceId);
  if (!existing || existing.workspaceId !== input.workspaceId) {
    return { ok: false, error: "Sentence not found." };
  }
  const prepared = await prepareSentenceWrite(input);
  if (!prepared.ok) return prepared;

  await prisma.$transaction(async (tx) => {
    await tx.card.deleteMany({ where: { sentenceId } });
    await tx.translation.deleteMany({ where: { sentenceId } });
    await tx.sentence.update({
      where: { id: sentenceId },
      data: {
        topicId: prepared.topicId,
        text: prepared.text,
        tokens: prepared.tokens,
        cards: { create: prepared.cardSeeds },
        translations: { create: prepared.translations },
      },
    });
  });
  return { ok: true, id: sentenceId };
}

export async function deleteSentence(sentenceId: string): Promise<void> {
  const userId = await requireUserId();
  const existing = await getSentenceForUser(userId, sentenceId);
  if (!existing) return;
  await prisma.sentence.delete({ where: { id: sentenceId } });
}
