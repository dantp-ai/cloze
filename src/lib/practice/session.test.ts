import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

let currentUserId = "";
vi.mock("@/lib/auth/guard", () => ({ requireUserId: async () => currentUserId }));

import { buildPracticeSession } from "./session";

const past = new Date(Date.now() - 86_400_000);
const future = new Date(Date.now() + 86_400_000);

async function seed() {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const ws = await prisma.workspace.create({
    data: { userId: user.id, name: "It", learningLang: "it", translationLangs: ["en"] },
  });
  currentUserId = user.id;
  return ws;
}

async function makeSentence(
  wsId: string,
  text: string,
  cards: { tokenIndex: number; answer: string; dueDate: Date; timesSeen: number }[],
  topicId?: string,
) {
  return prisma.sentence.create({
    data: {
      workspaceId: wsId,
      topicId,
      text,
      // A masked placeholder at index 0 (matching these fixtures' tokenIndex: 0 cards)
      // plus an unmasked token carrying the label, so redaction leaves `text` intact
      // for assertions while still exercising the masking path.
      tokens: [
        { text: "x", maskable: true },
        { text, maskable: false },
      ],
      cards: { create: cards },
    },
  });
}

describe("buildPracticeSession", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("includes due cards, excludes not-yet-due, and redacts the answer", async () => {
    const ws = await seed();
    await prisma.sentence.create({
      data: {
        workspaceId: ws.id,
        text: "il gatto",
        tokens: [
          { text: "il", maskable: true },
          { text: " ", maskable: false },
          { text: "gatto", maskable: true },
        ],
        cards: { create: [{ tokenIndex: 2, answer: "gatto", dueDate: past, timesSeen: 3 }] },
      },
    });
    await makeSentence(ws.id, "B", [{ tokenIndex: 0, answer: "later", dueDate: future, timesSeen: 3 }]);
    const items = await buildPracticeSession(ws.id, {});
    expect(items).toHaveLength(1);
    expect(items[0].blanks).toHaveLength(1);
    // The masked answer must not appear anywhere in the serialized session payload.
    expect(JSON.stringify(items)).not.toContain("gatto");
  });

  it("groups multiple due cards under one sentence", async () => {
    const ws = await seed();
    await makeSentence(ws.id, "A", [
      { tokenIndex: 0, answer: "one", dueDate: past, timesSeen: 1 },
      { tokenIndex: 2, answer: "two", dueDate: past, timesSeen: 1 },
    ]);
    const items = await buildPracticeSession(ws.id, {});
    expect(items).toHaveLength(1);
    expect(items[0].blanks.map((b) => b.tokenIndex).sort()).toEqual([0, 2]);
  });

  it("caps new cards at newCardsPerSession but keeps all due review cards", async () => {
    const ws = await seed();
    await prisma.workspace.update({
      where: { id: ws.id },
      data: { settings: { sr: { newCardsPerSession: 1 } } },
    });
    // two new cards (timesSeen 0), each its own sentence
    await makeSentence(ws.id, "N1", [{ tokenIndex: 0, answer: "n1", dueDate: past, timesSeen: 0 }]);
    await makeSentence(ws.id, "N2", [{ tokenIndex: 0, answer: "n2", dueDate: past, timesSeen: 0 }]);
    // one due review card
    await makeSentence(ws.id, "R", [{ tokenIndex: 0, answer: "r", dueDate: past, timesSeen: 4 }]);
    const items = await buildPracticeSession(ws.id, {});
    const totalBlanks = items.reduce((n, i) => n + i.blanks.length, 0);
    expect(totalBlanks).toBe(2); // 1 review + 1 new (capped)
  });

  it("scopes to a topic when given", async () => {
    const ws = await seed();
    const topic = await prisma.topic.create({ data: { workspaceId: ws.id, name: "T" } });
    await makeSentence(ws.id, "InTopic", [{ tokenIndex: 0, answer: "a", dueDate: past, timesSeen: 2 }], topic.id);
    await makeSentence(ws.id, "NoTopic", [{ tokenIndex: 0, answer: "b", dueDate: past, timesSeen: 2 }]);
    const items = await buildPracticeSession(ws.id, { topicId: topic.id });
    expect(items).toHaveLength(1);
    expect(items[0].text).toBe("InTopic");
  });

  it("returns nothing for a workspace the user does not own", async () => {
    const ws = await seed();
    await makeSentence(ws.id, "A", [{ tokenIndex: 0, answer: "x", dueDate: past, timesSeen: 1 }]);
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    expect(await buildPracticeSession(ws.id, {})).toEqual([]);
  });
});
