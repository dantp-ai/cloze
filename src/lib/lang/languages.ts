// ISO 639-1 codes for the languages DeepL supports as a source/target.
// The picker is intentionally limited to this set: DeepL only handles these,
// and a shorter list keeps the dropdowns uncluttered. Codes are sent to the
// provider upper-cased (see translate/providers.ts), e.g. "nb" -> "NB".
// Update this list when DeepL adds languages.
const DEEPL_LANG_CODES = [
  "ar", // Arabic
  "bg", // Bulgarian
  "cs", // Czech
  "da", // Danish
  "de", // German
  "el", // Greek
  "en", // English
  "es", // Spanish
  "et", // Estonian
  "fi", // Finnish
  "fr", // French
  "hu", // Hungarian
  "id", // Indonesian
  "it", // Italian
  "ja", // Japanese
  "ko", // Korean
  "lt", // Lithuanian
  "lv", // Latvian
  "nb", // Norwegian Bokmål
  "nl", // Dutch
  "pl", // Polish
  "pt", // Portuguese
  "ro", // Romanian
  "ru", // Russian
  "sk", // Slovak
  "sl", // Slovenian
  "sv", // Swedish
  "tr", // Turkish
  "uk", // Ukrainian
  "zh", // Chinese
];

const displayNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "language" })
    : null;

export function languageLabel(code: string): string {
  if (!displayNames) return code;
  try {
    const name = displayNames.of(code);
    return name && name.toLowerCase() !== code.toLowerCase() ? name : code;
  } catch {
    return code;
  }
}

// All languages offered by the picker, sorted by English display name.
export const ALL_LANGUAGES: { code: string; label: string }[] = DEEPL_LANG_CODES
  .map((code) => ({ code, label: languageLabel(code) }))
  .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));

export const COMMON_LANG_CODES = ["it", "es", "fr", "de", "en"];
