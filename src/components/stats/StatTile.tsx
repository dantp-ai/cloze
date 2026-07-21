export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}
