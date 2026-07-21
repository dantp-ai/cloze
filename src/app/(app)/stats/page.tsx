import { requireActiveWorkspace } from "@/lib/workspace/context";
import { getWorkspaceStats } from "@/lib/stats/queries";
import { StatTile } from "@/components/stats/StatTile";
import { Heatmap } from "@/components/stats/Heatmap";
import { MasteryBar } from "@/components/stats/MasteryBar";

export default async function StatsPage() {
  const workspace = await requireActiveWorkspace();
  const stats = await getWorkspaceStats(workspace.id);

  if (!stats || stats.totals.cards === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold tracking-tight">Stats</h1>
        <p className="text-sm text-neutral-500">No data yet. Add sentences and practice to see your stats.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold tracking-tight">Stats</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Streak" value={`${stats.streak} d`} />
        <StatTile label="Due today" value={stats.due.today} />
        <StatTile label="Due this week" value={stats.due.week} />
        <StatTile label="Accuracy" value={`${stats.accuracy.overall}%`} />
        <StatTile label="Sentences" value={stats.totals.sentences} />
        <StatTile label="Cards" value={stats.totals.cards} />
        <StatTile label="Reviews" value={stats.totals.reviews} />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Mastery</h2>
        <MasteryBar mastery={stats.mastery} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Activity (last 12 weeks)</h2>
        <Heatmap cells={stats.heatmap} />
      </section>

      {stats.accuracy.byTopic.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Accuracy by topic</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {stats.accuracy.byTopic.map((t) => (
              <li key={t.topic} className="flex justify-between">
                <span>{t.topic}</span>
                <span className="tabular-nums text-neutral-500">{t.pct}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.hardestWords.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Hardest words</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {stats.hardestWords.map((w, i) => (
              <li key={`${w.answer}-${w.sentence}-${i}`} className="flex justify-between gap-4">
                <span className="font-mono">{w.answer}</span>
                <span className="text-neutral-500">{w.lapses} lapses</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
