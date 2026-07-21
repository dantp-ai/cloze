"use server";

import { buildPracticeSession, type PracticeItem } from "@/lib/practice/session";

export async function startPractice(
  workspaceId: string,
  opts: { topicId?: string },
): Promise<PracticeItem[]> {
  return buildPracticeSession(workspaceId, opts);
}
