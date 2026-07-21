import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

let currentUserId = "";
vi.mock("@/lib/auth/guard", () => ({ requireUserId: async () => currentUserId }));

import { createTopic, renameTopic, deleteTopic } from "./actions";
import { listTopics } from "./queries";

async function seed() {
  const user = await prisma.user.create({ data: { email: "me@example.com", passwordHash: "x" } });
  const ws = await prisma.workspace.create({
    data: { userId: user.id, name: "Italian", learningLang: "it", translationLangs: ["en"] },
  });
  currentUserId = user.id;
  return { user, ws };
}

describe("topic actions", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a topic in an owned workspace", async () => {
    const { ws } = await seed();
    const res = await createTopic(ws.id, "Coffee");
    expect(res.ok).toBe(true);
    expect((await listTopics(ws.id)).map((t) => t.name)).toEqual(["Coffee"]);
  });

  it("rejects an empty name", async () => {
    const { ws } = await seed();
    expect(await createTopic(ws.id, "  ")).toEqual({ ok: false, error: "Topic name is required." });
  });

  it("refuses to create a topic in a workspace the user does not own", async () => {
    const { ws } = await seed();
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    expect(await createTopic(ws.id, "Coffee")).toEqual({ ok: false, error: "Workspace not found." });
    currentUserId = (await prisma.user.findFirst({ where: { email: "me@example.com" } }))!.id;
    expect(await listTopics(ws.id)).toHaveLength(0);
  });

  it("renames a topic", async () => {
    const { ws } = await seed();
    const created = await createTopic(ws.id, "Coffee");
    if (!created.ok) throw new Error("setup failed");
    await renameTopic(created.id, "Drinks");
    expect((await listTopics(ws.id))[0].name).toBe("Drinks");
  });

  it("deletes a topic but keeps its sentences (topicId nulled)", async () => {
    const { ws } = await seed();
    const created = await createTopic(ws.id, "Coffee");
    if (!created.ok) throw new Error("setup failed");
    const sentence = await prisma.sentence.create({
      data: { workspaceId: ws.id, topicId: created.id, text: "Ciao.", tokens: [] },
    });
    await deleteTopic(created.id);
    expect(await listTopics(ws.id)).toHaveLength(0);
    const after = await prisma.sentence.findUnique({ where: { id: sentence.id } });
    expect(after?.topicId).toBeNull();
  });

  it("does not delete a topic in another user's workspace", async () => {
    const { ws } = await seed();
    const created = await createTopic(ws.id, "Coffee");
    if (!created.ok) throw new Error("setup failed");
    const other = await prisma.user.create({ data: { email: "o@example.com", passwordHash: "x" } });
    currentUserId = other.id;
    await deleteTopic(created.id);
    currentUserId = (await prisma.user.findFirst({ where: { email: "me@example.com" } }))!.id;
    expect(await listTopics(ws.id)).toHaveLength(1);
  });
});
