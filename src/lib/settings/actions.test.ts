import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";
import { DEFAULT_SETTINGS, resolveSettings } from "./workspace-settings";

let currentUserId = "";
vi.mock("@/lib/auth/guard", () => ({ requireUserId: async () => currentUserId }));

import { updateSettings } from "./actions";

async function seed() {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const ws = await prisma.workspace.create({
    data: { userId: user.id, name: "It", learningLang: "it", translationLangs: ["en"] },
  });
  currentUserId = user.id;
  return ws;
}

describe("updateSettings", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("writes settings to the owned workspace", async () => {
    const ws = await seed();
    const next = { ...DEFAULT_SETTINGS, sr: { ...DEFAULT_SETTINGS.sr, newCardsPerSession: 7 } };
    const res = await updateSettings(ws.id, next);
    expect(res).toEqual({ ok: true });
    const stored = await prisma.workspace.findUnique({ where: { id: ws.id } });
    expect(resolveSettings(stored?.settings).sr.newCardsPerSession).toBe(7);
  });

  it("rejects invalid settings", async () => {
    const ws = await seed();
    const bad = { ...DEFAULT_SETTINGS, sr: { ...DEFAULT_SETTINGS.sr, minEase: -1 } };
    expect(await updateSettings(ws.id, bad)).toEqual({ ok: false, error: "Invalid settings." });
  });

  it("refuses to update a workspace the user does not own", async () => {
    const ws = await seed();
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    expect(await updateSettings(ws.id, DEFAULT_SETTINGS)).toEqual({ ok: false, error: "Workspace not found." });
  });
});
