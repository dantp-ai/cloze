import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";
import {
  resolveSettings,
  DEFAULT_SETTINGS,
  DEFAULT_TRANSLATION_SETTINGS,
} from "@/lib/settings/workspace-settings";

let currentUserId = "";
vi.mock("@/lib/auth/guard", () => ({ requireUserId: async () => currentUserId }));

import { updateSettings } from "@/lib/settings/actions";

async function seed() {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const ws = await prisma.workspace.create({
    data: { userId: user.id, name: "It", learningLang: "it", translationLangs: ["en"] },
  });
  currentUserId = user.id;
  return ws;
}

describe("translation settings", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("defaults translation to manual with an empty key", () => {
    expect(resolveSettings({}).translation).toEqual(DEFAULT_TRANSLATION_SETTINGS);
    expect(DEFAULT_SETTINGS.translation).toEqual({ provider: "manual", apiKey: "" });
  });

  it("merges a provided provider and ignores an invalid one", () => {
    expect(resolveSettings({ translation: { provider: "deepl" } }).translation.provider).toBe("deepl");
    expect(resolveSettings({ translation: { provider: "nope" } }).translation.provider).toBe("manual");
  });

  it("stores a new provider and api key", async () => {
    const ws = await seed();
    const next = {
      ...DEFAULT_SETTINGS,
      translation: { provider: "deepl" as const, apiKey: "secret-key" },
    };
    expect(await updateSettings(ws.id, next)).toEqual({ ok: true });
    const stored = await prisma.workspace.findUnique({ where: { id: ws.id } });
    expect(resolveSettings(stored?.settings).translation).toEqual({ provider: "deepl", apiKey: "secret-key" });
  });

  it("preserves the existing api key when the submitted key is blank", async () => {
    const ws = await seed();
    await updateSettings(ws.id, {
      ...DEFAULT_SETTINGS,
      translation: { provider: "deepl", apiKey: "keep-me" },
    });
    // Save again with a blank key (the client never re-sends the stored key).
    await updateSettings(ws.id, {
      ...DEFAULT_SETTINGS,
      translation: { provider: "google", apiKey: "" },
    });
    const stored = await prisma.workspace.findUnique({ where: { id: ws.id } });
    expect(resolveSettings(stored?.settings).translation).toEqual({ provider: "google", apiKey: "keep-me" });
  });
});
