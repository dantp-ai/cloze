import { requireUserId } from "@/lib/auth/guard";
import { listWorkspaces } from "@/lib/workspace/queries";
import { CreateWorkspaceForm } from "./CreateWorkspaceForm";

export default async function WorkspacesPage() {
  const userId = await requireUserId();
  const workspaces = await listWorkspaces(userId);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Workspaces</h1>
      {workspaces.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Create your first workspace to choose the language you want to learn and the languages you translate to.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {workspaces.map((w) => (
            <li key={w.id} className="rounded-md border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
              <span className="font-medium">{w.name}</span>
              <span className="ml-2 text-neutral-400">
                {w.learningLang} {"→"} {w.translationLangs.join("/")}
              </span>
            </li>
          ))}
        </ul>
      )}
      <CreateWorkspaceForm />
    </div>
  );
}
