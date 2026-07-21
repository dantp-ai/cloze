import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const withRelations = Prisma.validator<Prisma.SentenceDefaultArgs>()({
  include: { translations: true, cards: true, topic: true },
});

export type SentenceWithRelations = Prisma.SentenceGetPayload<typeof withRelations>;

export async function listSentences(
  workspaceId: string,
  topicId?: string,
): Promise<SentenceWithRelations[]> {
  return prisma.sentence.findMany({
    where: { workspaceId, ...(topicId ? { topicId } : {}) },
    include: withRelations.include,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function getSentenceForUser(
  userId: string,
  sentenceId: string,
): Promise<SentenceWithRelations | null> {
  return prisma.sentence.findFirst({
    where: { id: sentenceId, workspace: { userId } },
    include: withRelations.include,
  });
}
