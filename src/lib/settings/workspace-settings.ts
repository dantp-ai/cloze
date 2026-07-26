import { z } from "zod";
import { DEFAULT_SR_PARAMS, type SRParams } from "@/lib/sr/sm2";
import { DEFAULT_CHECK_OPTIONS, type CheckOptions } from "@/lib/practice/check";

export type TranslationProvider = "manual" | "deepl" | "google";
export type TranslationSettings = { provider: TranslationProvider; apiKey: string };
export const DEFAULT_TRANSLATION_SETTINGS: TranslationSettings = { provider: "manual", apiKey: "" };

// Practice-mode behavior. `translationCountsAsHint`: when true, answering a card
// with its translation visible is graded "Hard" (like the multiple-choice hint).
export type PracticeOptions = { translationCountsAsHint: boolean };
export const DEFAULT_PRACTICE_OPTIONS: PracticeOptions = { translationCountsAsHint: false };

export type WorkspaceSettings = {
  sr: SRParams;
  check: CheckOptions;
  translation: TranslationSettings;
  practice: PracticeOptions;
};

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  sr: DEFAULT_SR_PARAMS,
  check: DEFAULT_CHECK_OPTIONS,
  translation: DEFAULT_TRANSLATION_SETTINGS,
  practice: DEFAULT_PRACTICE_OPTIONS,
};

const srSchema = z.object({
  startingEase: z.number().positive(),
  minEase: z.number().positive(),
  hardMultiplier: z.number().positive(),
  easyBonus: z.number().positive(),
  intervalModifier: z.number().positive(),
  maxInterval: z.number().int().positive(),
  newCardsPerSession: z.number().int().nonnegative(),
});

const checkSchema = z.object({
  caseSensitive: z.boolean(),
  accentSensitive: z.boolean(),
});

const translationSchema = z.object({
  provider: z.enum(["manual", "deepl", "google"]),
  apiKey: z.string(),
});

const practiceSchema = z.object({
  translationCountsAsHint: z.boolean(),
});

// Merge a stored (possibly partial or invalid) blob over the defaults, field by field.
export function resolveSettings(raw: unknown): WorkspaceSettings {
  const blob = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const srRaw = (blob.sr && typeof blob.sr === "object" ? blob.sr : {}) as Record<string, unknown>;
  const checkRaw =
    (blob.check && typeof blob.check === "object" ? blob.check : {}) as Record<string, unknown>;

  const sr = { ...DEFAULT_SR_PARAMS };
  for (const key of Object.keys(DEFAULT_SR_PARAMS) as (keyof SRParams)[]) {
    const parsed = srSchema.shape[key].safeParse(srRaw[key]);
    if (parsed.success) sr[key] = parsed.data as number;
  }

  const check = { ...DEFAULT_CHECK_OPTIONS };
  for (const key of Object.keys(DEFAULT_CHECK_OPTIONS) as (keyof CheckOptions)[]) {
    const parsed = checkSchema.shape[key].safeParse(checkRaw[key]);
    if (parsed.success) check[key] = parsed.data as boolean;
  }

  const translationRaw =
    (blob.translation && typeof blob.translation === "object" ? blob.translation : {}) as Record<
      string,
      unknown
    >;
  const translation = { ...DEFAULT_TRANSLATION_SETTINGS };
  const providerParsed = translationSchema.shape.provider.safeParse(translationRaw.provider);
  if (providerParsed.success) translation.provider = providerParsed.data;
  const apiKeyParsed = translationSchema.shape.apiKey.safeParse(translationRaw.apiKey);
  if (apiKeyParsed.success) translation.apiKey = apiKeyParsed.data;

  const practiceRaw =
    (blob.practice && typeof blob.practice === "object" ? blob.practice : {}) as Record<
      string,
      unknown
    >;
  const practice = { ...DEFAULT_PRACTICE_OPTIONS };
  for (const key of Object.keys(DEFAULT_PRACTICE_OPTIONS) as (keyof PracticeOptions)[]) {
    const parsed = practiceSchema.shape[key].safeParse(practiceRaw[key]);
    if (parsed.success) practice[key] = parsed.data as boolean;
  }

  return { sr, check, translation, practice };
}

export function validateSettings(settings: WorkspaceSettings): boolean {
  return (
    srSchema.safeParse(settings.sr).success &&
    checkSchema.safeParse(settings.check).success &&
    translationSchema.safeParse(settings.translation).success &&
    practiceSchema.safeParse(settings.practice).success
  );
}
