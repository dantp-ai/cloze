import { redirect } from "next/navigation";
import type { Workspace } from "@prisma/client";
import { requireUserId } from "@/lib/auth/guard";
import { getActiveWorkspace } from "@/lib/workspace/queries";

export async function requireActiveWorkspace(): Promise<Workspace> {
  const userId = await requireUserId();
  const workspace = await getActiveWorkspace(userId);
  if (!workspace) redirect("/workspaces");
  return workspace;
}
