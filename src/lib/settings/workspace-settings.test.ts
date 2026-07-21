import { describe, it, expect } from "vitest";
import { resolveSettings, DEFAULT_SETTINGS } from "./workspace-settings";

describe("resolveSettings", () => {
  it("returns defaults for an empty or invalid blob", () => {
    expect(resolveSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(resolveSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(resolveSettings("garbage")).toEqual(DEFAULT_SETTINGS);
  });

  it("fills missing fields from defaults but keeps provided ones", () => {
    const resolved = resolveSettings({ sr: { newCardsPerSession: 5 }, check: { caseSensitive: true } });
    expect(resolved.sr.newCardsPerSession).toBe(5);
    expect(resolved.sr.startingEase).toBe(DEFAULT_SETTINGS.sr.startingEase);
    expect(resolved.check.caseSensitive).toBe(true);
    expect(resolved.check.accentSensitive).toBe(DEFAULT_SETTINGS.check.accentSensitive);
  });

  it("ignores non-numeric SR values and falls back to the default", () => {
    const resolved = resolveSettings({ sr: { minEase: "nope" } });
    expect(resolved.sr.minEase).toBe(DEFAULT_SETTINGS.sr.minEase);
  });
});
