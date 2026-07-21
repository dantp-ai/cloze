export function MasteryBar({
  mastery,
}: {
  mastery: { new: number; learning: number; mature: number };
}) {
  const total = mastery.new + mastery.learning + mastery.mature;
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  const segments = [
    { key: "new", label: "New", count: mastery.new, cls: "bg-neutral-300 dark:bg-neutral-600" },
    { key: "learning", label: "Learning", count: mastery.learning, cls: "bg-neutral-500 dark:bg-neutral-400" },
    { key: "mature", label: "Mature", count: mastery.mature, cls: "bg-neutral-800 dark:bg-neutral-200" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        {segments.map((s) => (
          <span key={s.key} className={s.cls} style={{ width: `${pct(s.count)}%` }} />
        ))}
      </div>
      <div className="flex gap-4 text-sm">
        {segments.map((s) => (
          <span key={s.key} className="text-neutral-600 dark:text-neutral-400">
            {s.label} <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{s.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
