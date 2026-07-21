import { requireActiveWorkspace } from "@/lib/workspace/context";
import { resolveSettings } from "@/lib/settings/workspace-settings";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";

export default async function SettingsPage() {
  const workspace = await requireActiveWorkspace();
  const settings = resolveSettings(workspace.settings);
  const hasApiKey = settings.translation.apiKey.length > 0;
  const clientSettings = {
    ...settings,
    translation: { ...settings.translation, apiKey: "" },
  };
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <SettingsForm workspaceId={workspace.id} settings={clientSettings} hasApiKey={hasApiKey} />
      <AppearanceSettings />
    </div>
  );
}
