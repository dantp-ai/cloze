import { describe, it, expect } from "vitest";
import { ALL_LANGUAGES, COMMON_LANG_CODES, languageLabel } from "./languages";

describe("languageLabel", () => {
  it("returns the English name for a known code", () => {
    expect(languageLabel("en")).toBe("English");
    expect(languageLabel("de")).toBe("German");
  });

  it("falls back to the raw code when there is no display name", () => {
    expect(languageLabel("zzz")).toBe("zzz");
  });
});

describe("ALL_LANGUAGES", () => {
  it("includes every common language code", () => {
    const codes = ALL_LANGUAGES.map((l) => l.code);
    for (const c of COMMON_LANG_CODES) expect(codes).toContain(c);
  });

  it("is limited to DeepL-supported languages", () => {
    const codes = ALL_LANGUAGES.map((l) => l.code);
    // Representative DeepL-supported languages are present...
    expect(codes).toEqual(expect.arrayContaining(["pl", "ja", "nl", "uk", "zh"]));
    // ...while languages DeepL does not support are excluded.
    expect(codes).not.toContain("sw"); // Swahili
    expect(codes).not.toContain("af"); // Afrikaans
    // The list stays small enough to keep the picker uncluttered.
    expect(ALL_LANGUAGES.length).toBeLessThan(40);
  });

  it("is sorted case-insensitively by label", () => {
    const labels = ALL_LANGUAGES.map((l) => l.label);
    const sorted = [...labels].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    );
    expect(labels).toEqual(sorted);
  });
});
