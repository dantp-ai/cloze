import type { Token } from "@/lib/text/tokenize";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";
import { getOwnedWorkspace } from "@/lib/workspace/queries";
import { resolveSettings } from "@/lib/settings/workspace-settings";

export type PracticeBlank = { cardId: string; tokenIndex: number };
export type PracticeItem = {
  sentenceId: string;
  text: string;
  tokens: Token[];
  blanks: PracticeBlank[];
};

export async function buildPracticeSession(
  workspaceId: string,
  opts: { topicId?: string },
): Promise<PracticeItem[]> {
  const userId = await requireUserId();
  const workspace = await getOwnedWorkspace(userId, workspaceId);
  if (!workspace) return [];

  const settings = resolveSettings(workspace.settings);
  const now = new Date();

  const dueCards = await prisma.card.findMany({
    where: {
      dueDate: { lte: now },
      sentence: { workspaceId, ...(opts.topicId ? { topicId: opts.topicId } : {}) },
    },
    orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    include: { sentence: { select: { id: true, text: true, tokens: true, createdAt: true } } },
  });

  // Keep all due review cards; cap new (never-seen) cards at the configured limit.
  let newBudget = settings.sr.newCardsPerSession;
  const selected = dueCards.filter((card) => {
    if (card.timesSeen > 0) return true;
    if (newBudget > 0) {
      newBudget -= 1;
      return true;
    }
    return false;
  });

  // Group by sentence, preserving first-seen (due) order.
  const order: string[] = [];
  const groups = new Map<string, PracticeItem>();
  for (const card of selected) {
    const s = card.sentence;
    if (!groups.has(s.id)) {
      order.push(s.id);
      groups.set(s.id, {
        sentenceId: s.id,
        text: s.text,
        tokens: s.tokens as unknown as Token[],
        blanks: [],
      });
    }
    groups.get(s.id)!.blanks.push({ cardId: card.id, tokenIndex: card.tokenIndex });
  }

  return order.map((id) => {
    const item = groups.get(id)!;
    const maskedSet = new Set(item.blanks.map((b) => b.tokenIndex));
    const tokens = item.tokens.map((t, i) => (maskedSet.has(i) ? { ...t, text: "" } : t));
    return { ...item, tokens, text: tokens.map((t) => t.text).join("") };
  });
}
