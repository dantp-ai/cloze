import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

let currentUserId = "";
vi.mock("@/lib/auth/guard", () => ({
  requireUserId: async () => currentUserId,
}));

import { createWorkspace, switchWorkspace, deleteWorkspace } from "./actions";
import { listWorkspaces, getActiveWorkspace } from "./queries";

const input = { name: "Italian", learningLang: "it", translationLangs: ["fr", "en"] };

describe("workspace actions", () => {
  beforeEach(async () => {
    await resetDb();
    const user = await prisma.user.create({
      data: { email: "me@example.com", passwordHash: "x" },
    });
    currentUserId = user.id;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a workspace and marks it active", async () => {
    const res = await createWorkspace(input);
    expect(res.ok).toBe(true);
    const list = await listWorkspaces(currentUserId);
    expect(list).toHaveLength(1);
    const active = await getActiveWorkspace(currentUserId);
    expect(active?.name).toBe("Italian");
  });

  it("rejects an empty name", async () => {
    const res = await createWorkspace({ ...input, name: "  " });
    expect(res).toEqual({ ok: false, error: "Workspace name is required." });
  });

  it("switches the active workspace", async () => {
    const a = await createWorkspace(input);
    const b = await createWorkspace({ ...input, name: "Spanish", learningLang: "es" });
    if (!a.ok || !b.ok) throw new Error("setup failed");
    await switchWorkspace(a.id);
    const active = await getActiveWorkspace(currentUserId);
    expect(active?.id).toBe(a.id);
  });

  it("reassigns active when the active workspace is deleted", async () => {
    const a = await createWorkspace(input);
    const b = await createWorkspace({ ...input, name: "Spanish", learningLang: "es" });
    if (!a.ok || !b.ok) throw new Error("setup failed");
    // b is active (created last). Delete it; active should fall back to a.
    await deleteWorkspace(b.id);
    const active = await getActiveWorkspace(currentUserId);
    expect(active?.id).toBe(a.id);
  });

  it("does not delete another user's workspace", async () => {
    const a = await createWorkspace(input);
    if (!a.ok) throw new Error("setup failed");
    const other = await prisma.user.create({
      data: { email: "other@example.com", passwordHash: "x" },
    });
    currentUserId = other.id;
    await deleteWorkspace(a.id); // should be a no-op for the other user
    currentUserId = (await prisma.user.findFirst({ where: { email: "me@example.com" } }))!.id;
    expect(await listWorkspaces(currentUserId)).toHaveLength(1);
  });

  it("does not switch to another user's workspace", async () => {
    const a = await createWorkspace(input);
    if (!a.ok) throw new Error("setup failed");
    const other = await prisma.user.create({
      data: { email: "other@example.com", passwordHash: "x" },
    });
    currentUserId = other.id;
    await switchWorkspace(a.id); // `a` belongs to the seeded user, not `other`
    // The non-owner's stored active workspace must remain untouched (null).
    const otherRow = await prisma.user.findUnique({ where: { id: other.id } });
    expect(otherRow?.activeWorkspaceId).toBeNull();
  });

  it("nulls the active workspace when the last remaining workspace is deleted", async () => {
    const a = await createWorkspace(input);
    if (!a.ok) throw new Error("setup failed");
    await deleteWorkspace(a.id);
    expect(await getActiveWorkspace(currentUserId)).toBeNull();
    const user = await prisma.user.findUnique({ where: { id: currentUserId } });
    expect(user?.activeWorkspaceId).toBeNull();
  });
});
