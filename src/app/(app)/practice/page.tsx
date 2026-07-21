import { requireActiveWorkspace } from "@/lib/workspace/context";
import { listTopics } from "@/lib/topic/queries";
import { PracticeSetup } from "@/components/practice/PracticeSetup";

export default async function PracticePage() {
  const workspace = await requireActiveWorkspace();
  const topics = await listTopics(workspace.id);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Practice</h1>
      <PracticeSetup
        workspaceId={workspace.id}
        topics={topics.map((t) => ({ id: t.id, name: t.name }))}
      />
    </div>
  );
}
