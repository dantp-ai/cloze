import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

async function seedCard() {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const ws = await prisma.workspace.create({
    data: { userId: user.id, name: "It", learningLang: "it", translationLangs: ["en"] },
  });
  const sentence = await prisma.sentence.create({
    data: { workspaceId: ws.id, text: "Ciao.", tokens: [{ text: "Ciao", maskable: true }] },
  });
  return prisma.card.create({ data: { sentenceId: sentence.id, tokenIndex: 0, answer: "Ciao" } });
}

describe("ReviewLog schema", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("records a review and cascades when its card is deleted", async () => {
    const card = await seedCard();
    await prisma.reviewLog.create({
      data: { cardId: card.id, grade: "good", wasCorrect: true, usedHint: false },
    });
    expect(await prisma.reviewLog.count()).toBe(1);
    await prisma.card.delete({ where: { id: card.id } });
    expect(await prisma.reviewLog.count()).toBe(0);
  });
});
