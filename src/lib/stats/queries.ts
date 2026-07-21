import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";
import { getOwnedWorkspace } from "@/lib/workspace/queries";
import { computeStreak, computeHeatmap, type HeatCell } from "@/lib/stats/streak";
import { masteryDistribution } from "@/lib/stats/mastery";

export type WorkspaceStats = {
  totals: { sentences: number; cards: number; reviews: number };
  due: { today: number; week: number };
  accuracy: { overall: number; byTopic: { topic: string; pct: number }[] };
  mastery: { new: number; learning: number; mature: number };
  hardestWords: { answer: string; lapses: number; sentence: string }[];
  streak: number;
  heatmap: HeatCell[];
};

const HEATMAP_DAYS = 84;

export async function getWorkspaceStats(
  workspaceId: string,
  now: Date = new Date(),
): Promise<WorkspaceStats | null> {
  const userId = await requireUserId();
  const workspace = await getOwnedWorkspace(userId, workspaceId);
  if (!workspace) return null;

  const inWorkspace = { sentence: { workspaceId } };
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfWeek = new Date(now.getTime() + 7 * 86_400_000);

  const [sentences, cardsCount, dueToday, dueWeek, cards, reviewRows, hardest] = await Promise.all([
    prisma.sentence.count({ where: { workspaceId } }),
    prisma.card.count({ where: inWorkspace }),
    prisma.card.count({ where: { ...inWorkspace, dueDate: { lte: endOfToday } } }),
    prisma.card.count({ where: { ...inWorkspace, dueDate: { lte: endOfWeek } } }),
    prisma.card.findMany({ where: inWorkspace, select: { timesSeen: true, interval: true } }),
    prisma.reviewLog.findMany({
      where: { card: inWorkspace },
      select: {
        reviewedAt: true,
        wasCorrect: true,
        card: { select: { sentence: { select: { topic: { select: { name: true } } } } } },
      },
    }),
    prisma.card.findMany({
      where: { ...inWorkspace, lapses: { gt: 0 } },
      orderBy: [{ lapses: "desc" }, { id: "asc" }],
      take: 5,
      select: { answer: true, lapses: true, sentence: { select: { text: true } } },
    }),
  ]);

  const reviews = reviewRows.length;
  const correct = reviewRows.filter((r) => r.wasCorrect).length;
  const overall = reviews === 0 ? 0 : Math.round((correct / reviews) * 100);

  const topicAgg = new Map<string, { correct: number; total: number }>();
  for (const r of reviewRows) {
    const name = r.card.sentence.topic?.name ?? "No topic";
    const agg = topicAgg.get(name) ?? { correct: 0, total: 0 };
    agg.total += 1;
    if (r.wasCorrect) agg.correct += 1;
    topicAgg.set(name, agg);
  }
  const byTopic = Array.from(topicAgg.entries())
    .map(([topic, a]) => ({ topic, pct: Math.round((a.correct / a.total) * 100) }))
    .sort((a, b) => a.topic.localeCompare(b.topic));

  const reviewDates = reviewRows.map((r) => r.reviewedAt);

  return {
    totals: { sentences, cards: cardsCount, reviews },
    due: { today: dueToday, week: dueWeek },
    accuracy: { overall, byTopic },
    mastery: masteryDistribution(cards),
    hardestWords: hardest.map((h) => ({
      answer: h.answer,
      lapses: h.lapses,
      sentence: h.sentence.text,
    })),
    streak: computeStreak(reviewDates, now),
    heatmap: computeHeatmap(reviewDates, HEATMAP_DAYS, now),
  };
}
