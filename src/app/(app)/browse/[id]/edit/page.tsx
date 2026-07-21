import { notFound } from "next/navigation";
import { getOwnedWorkspace } from "@/lib/workspace/queries";
import { requireUserId } from "@/lib/auth/guard";
import { getSentenceForUser } from "@/lib/sentence/queries";
import { listTopics } from "@/lib/topic/queries";
import { SentenceForm } from "@/components/sentence/SentenceForm";

export default async function EditSentencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const sentence = await getSentenceForUser(userId, id);
  if (!sentence) notFound();
  const workspace = await getOwnedWorkspace(userId, sentence.workspaceId);
  if (!workspace) notFound();
  const topics = await listTopics(sentence.workspaceId);
  const translations: Record<string, string> = {};
  for (const t of sentence.translations) translations[t.lang] = t.text;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Edit sentence</h1>
      <p className="text-sm text-neutral-500">
        Editing resets review progress for this sentence's words.
      </p>
      <SentenceForm
        workspaceId={sentence.workspaceId}
        translationLangs={workspace.translationLangs}
        topics={topics.map((t) => ({ id: t.id, name: t.name }))}
        mode="edit"
        sentenceId={sentence.id}
        initial={{
          text: sentence.text,
          maskedIndices: sentence.cards.map((c) => c.tokenIndex),
          topicId: sentence.topicId,
          translations,
        }}
      />
    </div>
  );
}
