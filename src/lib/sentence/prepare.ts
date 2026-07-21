import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";
import { getOwnedWorkspace } from "@/lib/workspace/queries";
import { tokenize } from "@/lib/text/tokenize";
import { buildCardSeeds } from "@/lib/sentence/cards";

export type SentenceInput = {
  workspaceId: string;
  topicId?: string | null;
  text: string;
  maskedIndices: number[];
  translations: { lang: string; text: string }[];
};

export type PreparedWrite = {
  text: string;
  tokens: ReturnType<typeof tokenize>;
  cardSeeds: ReturnType<typeof buildCardSeeds>;
  translations: { lang: string; text: string }[];
  topicId: string | null;
};

const inputSchema = z.object({
  workspaceId: z.string().min(1),
  topicId: z.string().min(1).nullish(),
  // Do not `.trim()` here: masked indices are chosen against tokenize(text) on the
  // client, so the server must tokenize and store the exact same string.
  text: z.string().min(1),
  maskedIndices: z.array(z.number().int().nonnegative()),
  translations: z.array(z.object({ lang: z.string().min(1), text: z.string() })),
});

// Validate the input against the owned workspace and return the data needed to write,
// or an error result. Shared by create (Task 5) and update (Task 6).
export async function prepareSentenceWrite(
  input: SentenceInput,
): Promise<{ ok: false; error: string } | ({ ok: true } & PreparedWrite)> {
  const userId = await requireUserId();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success || parsed.data.text.trim().length === 0) {
    return { ok: false, error: "Sentence text is required." };
  }

  const workspace = await getOwnedWorkspace(userId, parsed.data.workspaceId);
  if (!workspace) return { ok: false, error: "Workspace not found." };

  const tokens = tokenize(parsed.data.text);
  let cardSeeds;
  try {
    cardSeeds = buildCardSeeds(tokens, parsed.data.maskedIndices);
  } catch {
    return { ok: false, error: "One of the selected words cannot be masked." };
  }

  const translations = parsed.data.translations
    .map((t) => ({ lang: t.lang, text: t.text.trim() }))
    .filter((t) => t.text.length > 0);
  for (const t of translations) {
    if (!workspace.translationLangs.includes(t.lang)) {
      return { ok: false, error: "A translation language is not part of this workspace." };
    }
  }

  let topicId: string | null = null;
  if (parsed.data.topicId) {
    const topic = await prisma.topic.findFirst({
      where: { id: parsed.data.topicId, workspaceId: workspace.id },
    });
    if (!topic) return { ok: false, error: "Topic not found in this workspace." };
    topicId = topic.id;
  }

  return { ok: true, text: parsed.data.text, tokens, cardSeeds, translations, topicId };
}
