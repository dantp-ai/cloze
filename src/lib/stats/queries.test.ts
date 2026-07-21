import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

let currentUserId = "";
vi.mock("@/lib/auth/guard", () => ({ requireUserId: async () => currentUserId }));

import { getWorkspaceStats } from "./queries";

const now = new Date(2026, 0, 15, 12, 0, 0);
const at = (day: number) => new Date(2026, 0, day, 12, 0, 0);

async function seed() {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const ws = await prisma.workspace.create({
    data: { userId: user.id, name: "It", learningLang: "it", translationLangs: ["en"] },
  });
  currentUserId = user.id;
  return ws;
}

describe("getWorkspaceStats", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns null for a workspace the user does not own", async () => {
    const ws = await seed();
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    expect(await getWorkspaceStats(ws.id, now)).toBeNull();
  });

  it("assembles totals, due counts, accuracy, mastery, hardest words, streak, and heatmap", async () => {
    const ws = await seed();
    const topic = await prisma.topic.create({ data: { workspaceId: ws.id, name: "Coffee" } });

    // Sentence 1 (in topic): a mature card (seen, long interval), overdue, 2 lapses.
    const s1 = await prisma.sentence.create({
      data: {
        workspaceId: ws.id,
        topicId: topic.id,
        text: "Oggi ho preso un caffè.",
        tokens: [{ text: "preso", maskable: true }],
        cards: {
          create: [
            { tokenIndex: 0, answer: "preso", timesSeen: 4, interval: 40, lapses: 2, dueDate: at(14) },
          ],
        },
      },
      include: { cards: true },
    });
    // Sentence 2 (no topic): a new card (never seen), due later this week.
    await prisma.sentence.create({
      data: {
        workspaceId: ws.id,
        text: "Bevo il tè.",
        tokens: [{ text: "Bevo", maskable: true }],
        cards: { create: [{ tokenIndex: 0, answer: "Bevo", timesSeen: 0, interval: 0, dueDate: at(18) }] },
      },
    });

    // Reviews for the s1 card: 2 correct, 1 wrong, across two days.
    const cardId = s1.cards[0].id;
    await prisma.reviewLog.createMany({
      data: [
        { cardId, grade: "good", wasCorrect: true, usedHint: false, reviewedAt: at(15) },
        { cardId, grade: "good", wasCorrect: true, usedHint: false, reviewedAt: at(14) },
        { cardId, grade: "again", wasCorrect: false, usedHint: false, reviewedAt: at(14) },
      ],
    });

    const stats = await getWorkspaceStats(ws.id, now);
    if (!stats) throw new Error("expected stats");

    expect(stats.totals).toEqual({ sentences: 2, cards: 2, reviews: 3 });
    expect(stats.due.today).toBe(1); // only the overdue s1 card is due by end of today
    expect(stats.due.week).toBe(2); // s1 (overdue) + s2 (due day 18, within 7 days)
    expect(stats.accuracy.overall).toBe(67); // 2/3 rounded
    expect(stats.accuracy.byTopic).toEqual([{ topic: "Coffee", pct: 67 }]);
    expect(stats.mastery).toEqual({ new: 1, learning: 0, mature: 1 });
    expect(stats.hardestWords).toEqual([{ answer: "preso", lapses: 2, sentence: "Oggi ho preso un caffè." }]);
    expect(stats.streak).toBe(2); // reviews on day 15 and 14
    expect(stats.heatmap.length).toBe(84);
    expect(stats.heatmap[stats.heatmap.length - 1]).toEqual({ date: "2026-01-15", count: 1 });
  });
});
