export type Mastery = "new" | "learning" | "mature";

export const MATURE_INTERVAL_DAYS = 21;

export function classifyCard(card: { timesSeen: number; interval: number }): Mastery {
  if (card.timesSeen === 0) return "new";
  if (card.interval >= MATURE_INTERVAL_DAYS) return "mature";
  return "learning";
}

export function masteryDistribution(
  cards: { timesSeen: number; interval: number }[],
): { new: number; learning: number; mature: number } {
  const dist = { new: 0, learning: 0, mature: 0 };
  for (const card of cards) dist[classifyCard(card)] += 1;
  return dist;
}
