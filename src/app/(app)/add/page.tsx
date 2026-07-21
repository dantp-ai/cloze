import { requireActiveWorkspace } from "@/lib/workspace/context";
import { listTopics } from "@/lib/topic/queries";
import { SentenceForm } from "@/components/sentence/SentenceForm";

export default async function AddPage() {
  const workspace = await requireActiveWorkspace();
  const topics = await listTopics(workspace.id);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Add a sentence</h1>
      <SentenceForm
        workspaceId={workspace.id}
        translationLangs={workspace.translationLangs}
        topics={topics.map((t) => ({ id: t.id, name: t.name }))}
        mode="create"
      />
    </div>
  );
}
