import type { Token } from "@/lib/text/tokenize";
import { requireActiveWorkspace } from "@/lib/workspace/context";
import { listSentences } from "@/lib/sentence/queries";
import { maskedPreview } from "@/lib/sentence/render";
import { SentenceCard } from "@/components/sentence/SentenceCard";

export default async function BrowsePage() {
  const workspace = await requireActiveWorkspace();
  const sentences = await listSentences(workspace.id);
  const hoverLang = workspace.translationLangs[0] ?? null;

  const groups = new Map<string, { id: string; topic: string; items: typeof sentences }>();
  for (const s of sentences) {
    const key = s.topic?.id ?? "none";
    const topic = s.topic?.name ?? "No topic";
    if (!groups.has(key)) groups.set(key, { id: key, topic, items: [] });
    groups.get(key)!.items.push(s);
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold tracking-tight">Browse</h1>
      {sentences.length === 0 && (
        <p className="text-sm text-neutral-500">No sentences yet. Add one to get started.</p>
      )}
      {Array.from(groups.values()).map((group) => (
        <section key={group.id} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">{group.topic}</h2>
          {group.items.map((s) => (
            <SentenceCard
              key={s.id}
              lang={hoverLang}
              sentence={{
                id: s.id,
                preview: maskedPreview(
                  s.tokens as unknown as Token[],
                  s.cards.map((c) => c.tokenIndex),
                ),
                translations: s.translations.map((t) => ({ lang: t.lang, text: t.text })),
              }}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
