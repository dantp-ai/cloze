import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

let currentUserId = "";
vi.mock("@/lib/auth/guard", () => ({ requireUserId: async () => currentUserId }));

import { createSentence } from "./actions";
import { listSentences } from "./queries";

async function seed() {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const ws = await prisma.workspace.create({
    data: { userId: user.id, name: "Italian", learningLang: "it", translationLangs: ["en", "fr"] },
  });
  currentUserId = user.id;
  return { user, ws };
}

const base = {
  text: "Oggi ho preso un caffè.",
  maskedIndices: [4], // "preso"
  translations: [{ lang: "en", text: "Today I had a coffee." }],
};

describe("createSentence", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a sentence with tokens, a masked card, and a translation", async () => {
    const { ws } = await seed();
    const res = await createSentence({ workspaceId: ws.id, ...base });
    expect(res.ok).toBe(true);
    const [sentence] = await listSentences(ws.id);
    expect(sentence.text).toBe(base.text);
    expect(sentence.cards).toHaveLength(1);
    expect(sentence.cards[0].answer).toBe("preso");
    expect(sentence.translations[0].text).toBe("Today I had a coffee.");
    expect(Array.isArray(sentence.tokens)).toBe(true);
  });

  it("rejects blank sentence text", async () => {
    const { ws } = await seed();
    expect(await createSentence({ workspaceId: ws.id, ...base, text: "   " })).toEqual({
      ok: false,
      error: "Sentence text is required.",
    });
  });

  it("rejects a masked index that is not a word", async () => {
    const { ws } = await seed();
    expect(await createSentence({ workspaceId: ws.id, ...base, maskedIndices: [1] })).toEqual({
      ok: false,
      error: "One of the selected words cannot be masked.",
    });
  });

  it("rejects a translation language not in the workspace", async () => {
    const { ws } = await seed();
    const res = await createSentence({
      workspaceId: ws.id,
      ...base,
      translations: [{ lang: "de", text: "..." }],
    });
    expect(res).toEqual({ ok: false, error: "A translation language is not part of this workspace." });
  });

  it("rejects a topic that belongs to another workspace", async () => {
    const { ws } = await seed();
    const otherWs = await prisma.workspace.create({
      data: { userId: currentUserId, name: "Spanish", learningLang: "es", translationLangs: ["en"] },
    });
    const foreignTopic = await prisma.topic.create({ data: { workspaceId: otherWs.id, name: "X" } });
    const res = await createSentence({ workspaceId: ws.id, ...base, topicId: foreignTopic.id });
    expect(res).toEqual({ ok: false, error: "Topic not found in this workspace." });
  });

  it("refuses to create in a workspace the user does not own", async () => {
    const { ws } = await seed();
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    expect(await createSentence({ workspaceId: ws.id, ...base })).toEqual({
      ok: false,
      error: "Workspace not found.",
    });
  });

  it("ignores blank translations", async () => {
    const { ws } = await seed();
    await createSentence({
      workspaceId: ws.id,
      ...base,
      translations: [{ lang: "en", text: "hi" }, { lang: "fr", text: "  " }],
    });
    const [sentence] = await listSentences(ws.id);
    expect(sentence.translations.map((t) => t.lang)).toEqual(["en"]);
  });
});
