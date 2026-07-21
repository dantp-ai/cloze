import type { HeatCell } from "@/lib/stats/streak";

function heatClass(count: number): string {
  if (count === 0) return "bg-neutral-100 dark:bg-neutral-800";
  if (count < 3) return "bg-neutral-300 dark:bg-neutral-600";
  if (count < 6) return "bg-neutral-500 dark:bg-neutral-400";
  return "bg-neutral-800 dark:bg-neutral-200";
}

export function Heatmap({ cells }: { cells: HeatCell[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {cells.map((cell) => (
        <span
          key={cell.date}
          title={`${cell.date}: ${cell.count} reviews`}
          className={"h-3 w-3 rounded-sm " + heatClass(cell.count)}
        />
      ))}
    </div>
  );
}
