export function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeStreak(reviewDates: Date[], today: Date): number {
  const days = new Set(reviewDates.map(toDayKey));
  if (days.size === 0) return 0;

  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(toDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(toDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type HeatCell = { date: string; count: number };

export function computeHeatmap(reviewDates: Date[], days: number, today: Date): HeatCell[] {
  const counts = new Map<string, number>();
  for (const d of reviewDates) {
    const k = toDayKey(d);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const cells: HeatCell[] = [];
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = toDayKey(cursor);
    cells.push({ date: key, count: counts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}
