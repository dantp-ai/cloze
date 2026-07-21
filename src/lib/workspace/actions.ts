"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";

export type WorkspaceInput = {
  name: string;
  learningLang: string;
  translationLangs: string[];
};

export type CreateResult = { ok: true; id: string } | { ok: false; error: string };

const schema = z.object({
  name: z.string().trim().min(1),
  learningLang: z.string().trim().min(2),
  translationLangs: z.array(z.string().trim().min(2)).min(1),
});

export async function createWorkspace(input: WorkspaceInput): Promise<CreateResult> {
  const userId = await requireUserId();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue.path[0] === "name") return { ok: false, error: "Workspace name is required." };
    if (issue.path[0] === "learningLang") return { ok: false, error: "Choose a language to learn." };
    return { ok: false, error: "Choose at least one translation language." };
  }
  const workspace = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        userId,
        name: parsed.data.name,
        learningLang: parsed.data.learningLang,
        translationLangs: parsed.data.translationLangs,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { activeWorkspaceId: ws.id },
    });
    return ws;
  });
  return { ok: true, id: workspace.id };
}

export async function switchWorkspace(workspaceId: string): Promise<void> {
  const userId = await requireUserId();
  const owned = await prisma.workspace.findFirst({ where: { id: workspaceId, userId } });
  if (!owned) return;
  await prisma.user.update({ where: { id: userId }, data: { activeWorkspaceId: workspaceId } });
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const userId = await requireUserId();
  try {
    await prisma.$transaction(async (tx) => {
      const owned = await tx.workspace.findFirst({ where: { id: workspaceId, userId } });
      if (!owned) return;
      await tx.workspace.delete({ where: { id: workspaceId } });
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user?.activeWorkspaceId === workspaceId) {
        const fallback = await tx.workspace.findFirst({
          where: { userId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });
        await tx.user.update({
          where: { id: userId },
          data: { activeWorkspaceId: fallback?.id ?? null },
        });
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return;
    throw e;
  }
}
