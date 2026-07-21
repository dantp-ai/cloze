import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

let currentUserId = "";
vi.mock("@/lib/auth/guard", () => ({ requireUserId: async () => currentUserId }));

import { createSentence, updateSentence, deleteSentence } from "./actions";
import { listSentences } from "./queries";

async function seed() {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const ws = await prisma.workspace.create({
    data: { userId: user.id, name: "Italian", learningLang: "it", translationLangs: ["en"] },
  });
  currentUserId = user.id;
  return { user, ws };
}

const base = {
  text: "Oggi ho preso un caffè.",
  maskedIndices: [4],
  translations: [{ lang: "en", text: "Today I had a coffee." }],
};

describe("updateSentence / deleteSentence", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("updates text, re-masks, and replaces translations", async () => {
    const { ws } = await seed();
    const created = await createSentence({ workspaceId: ws.id, ...base });
    if (!created.ok) throw new Error("setup failed");
    const res = await updateSentence(created.id, {
      workspaceId: ws.id,
      text: "Bevo un tè.",
      maskedIndices: [0], // "Bevo"
      translations: [{ lang: "en", text: "I drink a tea." }],
    });
    expect(res.ok).toBe(true);
    const [sentence] = await listSentences(ws.id);
    expect(sentence.text).toBe("Bevo un tè.");
    expect(sentence.cards).toHaveLength(1);
    expect(sentence.cards[0].answer).toBe("Bevo");
    expect(sentence.translations[0].text).toBe("I drink a tea.");
  });

  it("does not update a sentence the user does not own", async () => {
    const { ws } = await seed();
    const created = await createSentence({ workspaceId: ws.id, ...base });
    if (!created.ok) throw new Error("setup failed");
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    const res = await updateSentence(created.id, { workspaceId: ws.id, ...base, text: "Hacked." });
    expect(res).toEqual({ ok: false, error: "Sentence not found." });
    currentUserId = (await prisma.user.findFirst({ where: { email: "me@example.com" } }))!.id;
    expect((await listSentences(ws.id))[0].text).toBe(base.text);
  });

  it("deletes a sentence and cascades its cards and translations", async () => {
    const { ws } = await seed();
    const created = await createSentence({ workspaceId: ws.id, ...base });
    if (!created.ok) throw new Error("setup failed");
    await deleteSentence(created.id);
    expect(await listSentences(ws.id)).toHaveLength(0);
    expect(await prisma.card.count()).toBe(0);
    expect(await prisma.translation.count()).toBe(0);
  });

  it("does not delete another user's sentence", async () => {
    const { ws } = await seed();
    const created = await createSentence({ workspaceId: ws.id, ...base });
    if (!created.ok) throw new Error("setup failed");
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    await deleteSentence(created.id);
    currentUserId = (await prisma.user.findFirst({ where: { email: "me@example.com" } }))!.id;
    expect(await listSentences(ws.id)).toHaveLength(1);
  });
});
