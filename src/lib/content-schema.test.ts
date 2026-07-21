import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

async function seedWorkspace() {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const workspace = await prisma.workspace.create({
    data: { userId: user.id, name: "Italian", learningLang: "it", translationLangs: ["en"] },
  });
  return { user, workspace };
}

describe("content schema", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a topic, sentence, translation, and card", async () => {
    const { workspace } = await seedWorkspace();
    const topic = await prisma.topic.create({ data: { workspaceId: workspace.id, name: "Coffee" } });
    const sentence = await prisma.sentence.create({
      data: {
        workspaceId: workspace.id,
        topicId: topic.id,
        text: "Oggi ho preso un caffè.",
        tokens: [{ text: "Oggi", maskable: true }],
        translations: { create: [{ lang: "en", text: "Today I had a coffee." }] },
        cards: { create: [{ tokenIndex: 0, answer: "Oggi" }] },
      },
      include: { translations: true, cards: true },
    });
    expect(sentence.translations[0].text).toBe("Today I had a coffee.");
    expect(sentence.cards[0].answer).toBe("Oggi");
    expect(sentence.cards[0].easeFactor).toBe(2.5);
  });

  it("cascades deletes from workspace to sentences, cards, and translations", async () => {
    const { workspace } = await seedWorkspace();
    await prisma.sentence.create({
      data: {
        workspaceId: workspace.id,
        text: "Ciao.",
        tokens: [{ text: "Ciao", maskable: true }],
        cards: { create: [{ tokenIndex: 0, answer: "Ciao" }] },
        translations: { create: [{ lang: "en", text: "Hi." }] },
      },
    });
    await prisma.workspace.delete({ where: { id: workspace.id } });
    expect(await prisma.sentence.count()).toBe(0);
    expect(await prisma.card.count()).toBe(0);
    expect(await prisma.translation.count()).toBe(0);
  });

  it("sets topicId to null when its topic is deleted (keeps the sentence)", async () => {
    const { workspace } = await seedWorkspace();
    const topic = await prisma.topic.create({ data: { workspaceId: workspace.id, name: "Coffee" } });
    const sentence = await prisma.sentence.create({
      data: { workspaceId: workspace.id, topicId: topic.id, text: "Ciao.", tokens: [] },
    });
    await prisma.topic.delete({ where: { id: topic.id } });
    const after = await prisma.sentence.findUnique({ where: { id: sentence.id } });
    expect(after).not.toBeNull();
    expect(after?.topicId).toBeNull();
  });
});
