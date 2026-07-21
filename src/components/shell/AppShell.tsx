import { LeftRail } from "./LeftRail";
import { TopBar } from "./TopBar";
import { ZenProvider } from "@/components/zen/ZenProvider";
import { ShellFrame } from "./ShellFrame";
import type { WorkspaceLite } from "@/types/workspace";

export function AppShell({
  workspaces,
  activeId,
  children,
}: {
  workspaces: WorkspaceLite[];
  activeId: string | null;
  children: React.ReactNode;
}) {
  return (
    <ZenProvider>
      <ShellFrame rail={<LeftRail />} topBar={<TopBar workspaces={workspaces} activeId={activeId} />}>
        {children}
      </ShellFrame>
    </ZenProvider>
  );
}
