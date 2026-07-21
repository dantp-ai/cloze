import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

let currentUserId = "";
vi.mock("@/lib/auth/guard", () => ({ requireUserId: async () => currentUserId }));

import { submitReview, getCardOptions } from "./actions";

async function seed() {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const ws = await prisma.workspace.create({
    data: { userId: user.id, name: "It", learningLang: "it", translationLangs: ["en"] },
  });
  currentUserId = user.id;
  return ws;
}

async function makeCard(wsId: string, answer: string, dueDate = new Date()) {
  const sentence = await prisma.sentence.create({
    data: { workspaceId: wsId, text: `${answer}.`, tokens: [{ text: answer, maskable: true }] },
  });
  return prisma.card.create({ data: { sentenceId: sentence.id, tokenIndex: 0, answer, dueDate } });
}

describe("submitReview", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("grades a correct no-hint answer as good, reschedules, and logs it", async () => {
    const ws = await seed();
    const card = await makeCard(ws.id, "preso");
    const res = await submitReview([{ cardId: card.id, input: "PRESO", usedHint: false }]);
    if (!res.ok) throw new Error("expected ok");
    expect(res.feedback[0]).toMatchObject({ cardId: card.id, correct: true, answer: "preso", grade: "good" });
    const after = await prisma.card.findUnique({ where: { id: card.id } });
    expect(after?.timesSeen).toBe(1);
    expect(after?.timesCorrect).toBe(1);
    expect(after!.dueDate.getTime()).toBeGreaterThan(Date.now());
    expect(await prisma.reviewLog.count()).toBe(1);
  });

  it("grades a correct answer with a used hint as hard", async () => {
    const ws = await seed();
    const card = await makeCard(ws.id, "preso");
    const res = await submitReview([{ cardId: card.id, input: "preso", usedHint: true }]);
    if (!res.ok) throw new Error("expected ok");
    expect(res.feedback[0].grade).toBe("hard");
  });

  it("grades a wrong answer as again and increments lapses", async () => {
    const ws = await seed();
    const card = await makeCard(ws.id, "preso");
    const res = await submitReview([{ cardId: card.id, input: "sbagliato", usedHint: false }]);
    if (!res.ok) throw new Error("expected ok");
    expect(res.feedback[0]).toMatchObject({ correct: false, grade: "again", answer: "preso" });
    const after = await prisma.card.findUnique({ where: { id: card.id } });
    expect(after?.lapses).toBe(1);
    expect(after?.timesCorrect).toBe(0);
  });

  it("refuses to grade a card the user does not own", async () => {
    const ws = await seed();
    const card = await makeCard(ws.id, "preso");
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    expect(await submitReview([{ cardId: card.id, input: "preso", usedHint: false }])).toEqual({
      ok: false,
      error: "Card not found.",
    });
    const after = await prisma.card.findUnique({ where: { id: card.id } });
    expect(after?.timesSeen).toBe(0); // unchanged
  });
});

describe("getCardOptions", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns the answer among shuffled options with distractors from the workspace", async () => {
    const ws = await seed();
    const card = await makeCard(ws.id, "preso");
    await makeCard(ws.id, "bevut");
    await makeCard(ws.id, "amico");
    const res = await getCardOptions(card.id);
    if (!res.ok) throw new Error("expected ok");
    expect(res.options).toContain("preso");
    expect(res.options.length).toBeGreaterThan(1);
    expect(new Set(res.options).size).toBe(res.options.length); // no duplicates
  });

  it("refuses a card the user does not own", async () => {
    const ws = await seed();
    const card = await makeCard(ws.id, "preso");
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    expect(await getCardOptions(card.id)).toEqual({ ok: false, error: "Card not found." });
  });
});
