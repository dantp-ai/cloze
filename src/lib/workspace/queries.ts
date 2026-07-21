import type { Workspace } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listWorkspaces(userId: string): Promise<Workspace[]> {
  return prisma.workspace.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function getActiveWorkspace(userId: string): Promise<Workspace | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  if (user.activeWorkspaceId) {
    const active = await prisma.workspace.findFirst({
      where: { id: user.activeWorkspaceId, userId },
    });
    if (active) return active;
  }
  return prisma.workspace.findFirst({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function getOwnedWorkspace(
  userId: string,
  workspaceId: string,
): Promise<Workspace | null> {
  return prisma.workspace.findFirst({ where: { id: workspaceId, userId } });
}
