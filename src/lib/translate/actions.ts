"use server";

import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";
import { resolveSettings } from "@/lib/settings/workspace-settings";
import { translateWith, UnsupportedLanguageError } from "@/lib/translate/providers";
import { languageLabel } from "@/lib/lang/languages";

export async function getTranslation(
  sentenceId: string,
  lang: string,
): Promise<{ ok: true; text: string | null } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const sentence = await prisma.sentence.findFirst({
    where: { id: sentenceId, workspace: { userId } },
    include: { translations: { where: { lang } }, workspace: true },
  });
  if (!sentence) return { ok: false, error: "Sentence not found." };

  const existing = sentence.translations[0];
  if (existing) return { ok: true, text: existing.text };

  const settings = resolveSettings(sentence.workspace.settings);
  if (settings.translation.provider === "manual") return { ok: true, text: null };

  try {
    const text = await translateWith(
      settings.translation.provider,
      sentence.text,
      sentence.workspace.learningLang,
      lang,
      settings.translation.apiKey,
    );
    await prisma.translation.upsert({
      where: { sentenceId_lang: { sentenceId, lang } },
      create: { sentenceId, lang, text },
      update: { text },
    });
    return { ok: true, text };
  } catch (err) {
    if (err instanceof UnsupportedLanguageError) {
      const source = sentence.workspace.learningLang;
      return {
        ok: false,
        error: `${languageLabel(source)} → ${languageLabel(lang)} isn't supported for translation yet.`,
      };
    }
    return { ok: false, error: "Translation failed." };
  }
}
