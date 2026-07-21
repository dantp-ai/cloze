import { requireActiveWorkspace } from "@/lib/workspace/context";
import { listSentences } from "@/lib/sentence/queries";
import { SideBySide } from "@/components/translate/SideBySide";

export default async function ReadPage() {
  const workspace = await requireActiveWorkspace();
  const sentences = await listSentences(workspace.id);
  const rows = sentences.map((s) => ({
    id: s.id,
    text: s.text,
    translations: Object.fromEntries(s.translations.map((t) => [t.lang, t.text])),
  }));
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Read</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No sentences yet. Add one to read side by side.</p>
      ) : (
        <SideBySide langs={workspace.translationLangs} rows={rows} />
      )}
    </div>
  );
}
