import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

let currentUserId = "";
vi.mock("@/lib/auth/guard", () => ({ requireUserId: async () => currentUserId }));

// Mock the provider layer so no real network is hit, but keep the real
// UnsupportedLanguageError class so `instanceof` checks in the action work.
const translateWith = vi.fn(async (..._args: unknown[]) => "the cat");
vi.mock("@/lib/translate/providers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/translate/providers")>();
  return { ...actual, translateWith: (...args: unknown[]) => translateWith(...args) };
});

import { getTranslation } from "./actions";
import { UnsupportedLanguageError } from "./providers";

async function seed(settings?: object) {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const ws = await prisma.workspace.create({
    data: {
      userId: user.id,
      name: "It",
      learningLang: "it",
      translationLangs: ["en"],
      settings: settings ?? {},
    },
  });
  currentUserId = user.id;
  const sentence = await prisma.sentence.create({
    data: { workspaceId: ws.id, text: "il gatto", tokens: [{ text: "gatto", maskable: true }] },
  });
  return { ws, sentence };
}

describe("getTranslation", () => {
  beforeEach(async () => {
    await resetDb();
    translateWith.mockClear();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns a stored translation without calling a provider", async () => {
    const { sentence } = await seed();
    await prisma.translation.create({ data: { sentenceId: sentence.id, lang: "en", text: "the cat (mine)" } });
    const res = await getTranslation(sentence.id, "en");
    expect(res).toEqual({ ok: true, text: "the cat (mine)" });
    expect(translateWith).not.toHaveBeenCalled();
  });

  it("returns null in manual mode when nothing is stored", async () => {
    const { sentence } = await seed();
    expect(await getTranslation(sentence.id, "en")).toEqual({ ok: true, text: null });
    expect(translateWith).not.toHaveBeenCalled();
  });

  it("fetches and caches when an auto provider is configured", async () => {
    const { sentence } = await seed({ translation: { provider: "deepl", apiKey: "key" } });
    const res = await getTranslation(sentence.id, "en");
    expect(res).toEqual({ ok: true, text: "the cat" });
    expect(translateWith).toHaveBeenCalledWith("deepl", "il gatto", "it", "en", "key");
    const stored = await prisma.translation.findFirst({ where: { sentenceId: sentence.id, lang: "en" } });
    expect(stored?.text).toBe("the cat");
    // second call is served from cache
    await getTranslation(sentence.id, "en");
    expect(translateWith).toHaveBeenCalledTimes(1);
  });

  it("returns an error when the provider throws", async () => {
    const { sentence } = await seed({ translation: { provider: "deepl", apiKey: "key" } });
    translateWith.mockRejectedValueOnce(new Error("boom"));
    expect(await getTranslation(sentence.id, "en")).toEqual({ ok: false, error: "Translation failed." });
  });

  it("names the languages when the provider does not support them", async () => {
    const { sentence } = await seed({ translation: { provider: "deepl", apiKey: "key" } });
    translateWith.mockRejectedValueOnce(new UnsupportedLanguageError());
    expect(await getTranslation(sentence.id, "en")).toEqual({
      ok: false,
      error: "Italian → English isn't supported for translation yet.",
    });
  });

  it("refuses a sentence the user does not own", async () => {
    const { sentence } = await seed();
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    expect(await getTranslation(sentence.id, "en")).toEqual({ ok: false, error: "Sentence not found." });
  });
});
