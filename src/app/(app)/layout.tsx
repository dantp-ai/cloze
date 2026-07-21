import { requireUserId } from "@/lib/auth/guard";
import { listWorkspaces, getActiveWorkspace } from "@/lib/workspace/queries";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId();
  const [workspaces, active] = await Promise.all([
    listWorkspaces(userId),
    getActiveWorkspace(userId),
  ]);
  const lite = workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    learningLang: w.learningLang,
    translationLangs: w.translationLangs,
  }));
  return (
    <AppShell workspaces={lite} activeId={active?.id ?? null}>
      {children}
    </AppShell>
  );
}
