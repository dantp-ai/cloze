export const ZEN_DEFAULT_KEY = "zenDefault";

// Appearance preferences are app-wide (not per workspace) and live in localStorage,
// the same place the theme preference is kept.
export function readZenDefault(): boolean {
  try {
    return localStorage.getItem(ZEN_DEFAULT_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeZenDefault(value: boolean): void {
  try {
    localStorage.setItem(ZEN_DEFAULT_KEY, value ? "true" : "false");
  } catch {
    // Ignore storage failures; the preference is a convenience, not critical state.
  }
}
