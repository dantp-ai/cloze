import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LogoutButton } from "./LogoutButton";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";
import { ZenToggle } from "@/components/zen/ZenToggle";
import type { WorkspaceLite } from "@/types/workspace";

export function TopBar({
  workspaces,
  activeId,
}: {
  workspaces: WorkspaceLite[];
  activeId: string | null;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
      <WorkspaceSwitcher workspaces={workspaces} activeId={activeId} />
      <ZenToggle />
      <ThemeToggle />
      <LogoutButton />
    </div>
  );
}
