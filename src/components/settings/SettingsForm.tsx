"use client";

import { useState } from "react";
import { updateSettings } from "@/lib/settings/actions";
import type { WorkspaceSettings } from "@/lib/settings/workspace-settings";

const SR_FIELDS: { key: keyof WorkspaceSettings["sr"]; label: string; step: string }[] = [
  { key: "newCardsPerSession", label: "New cards per session", step: "1" },
  { key: "startingEase", label: "Starting ease", step: "0.1" },
  { key: "minEase", label: "Minimum ease", step: "0.1" },
  { key: "hardMultiplier", label: "Hard multiplier", step: "0.1" },
  { key: "easyBonus", label: "Easy bonus", step: "0.1" },
  { key: "intervalModifier", label: "Interval modifier", step: "0.1" },
  { key: "maxInterval", label: "Max interval (days)", step: "1" },
];

export function SettingsForm({
  workspaceId,
  settings,
  hasApiKey = false,
}: {
  workspaceId: string;
  settings: WorkspaceSettings;
  hasApiKey?: boolean;
}) {
  const [sr, setSr] = useState(settings.sr);
  const [check, setCheck] = useState(settings.check);
  const [translation, setTranslation] = useState(settings.translation);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const res = await updateSettings(workspaceId, { sr, check, translation });
      if (res.ok) setSaved(true);
      else setError(res.error);
    } catch {
      setError("Could not save settings.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-neutral-500">Spaced repetition</h2>
      {SR_FIELDS.map((field) => (
        <div key={field.key} className="flex items-center justify-between gap-4">
          <label htmlFor={field.key} className="text-sm">{field.label}</label>
          <input
            id={field.key}
            type="number"
            step={field.step}
            value={sr[field.key]}
            onChange={(e) => setSr((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
            className="w-28 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-right dark:border-neutral-700"
          />
        </div>
      ))}

      <h2 className="mt-2 text-sm font-medium text-neutral-500">Answer checking</h2>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={check.caseSensitive}
          onChange={(e) => setCheck((prev) => ({ ...prev, caseSensitive: e.target.checked }))}
        />
        Case sensitive
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={check.accentSensitive}
          onChange={(e) => setCheck((prev) => ({ ...prev, accentSensitive: e.target.checked }))}
        />
        Accent sensitive
      </label>

      <h2 className="mt-2 text-sm font-medium text-neutral-500">Translation</h2>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="translation-provider" className="text-sm">Translation provider</label>
        <select
          id="translation-provider"
          value={translation.provider}
          onChange={(e) =>
            setTranslation((prev) => ({ ...prev, provider: e.target.value as typeof prev.provider }))
          }
          className="w-40 rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
        >
          <option value="manual">Manual</option>
          <option value="deepl">DeepL</option>
          <option value="google">Google</option>
        </select>
      </div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="translation-key" className="text-sm">API key</label>
        <input
          id="translation-key"
          type="password"
          value={translation.apiKey}
          placeholder={hasApiKey ? "Key set - leave blank to keep" : "Enter API key"}
          autoComplete="off"
          onChange={(e) => setTranslation((prev) => ({ ...prev, apiKey: e.target.value }))}
          className="w-40 rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        Save settings
      </button>
    </form>
  );
}
