"use server";

import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";
import { getOwnedWorkspace } from "@/lib/workspace/queries";
import { type WorkspaceSettings, validateSettings, resolveSettings } from "@/lib/settings/workspace-settings";

export async function updateSettings(
  workspaceId: string,
  settings: WorkspaceSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!validateSettings(settings)) return { ok: false, error: "Invalid settings." };
  const workspace = await getOwnedWorkspace(userId, workspaceId);
  if (!workspace) return { ok: false, error: "Workspace not found." };

  // The client never re-sends the stored API key; a blank submitted key means "keep the existing one".
  const current = resolveSettings(workspace.settings);
  const apiKey =
    settings.translation.apiKey.trim() === "" ? current.translation.apiKey : settings.translation.apiKey;

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      settings: {
        sr: settings.sr,
        check: settings.check,
        translation: { provider: settings.translation.provider, apiKey },
      },
    },
  });
  return { ok: true };
}
