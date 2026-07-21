import type { Token } from "@/lib/text/tokenize";

export const SM2_DEFAULTS = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  lapses: 0,
  timesSeen: 0,
  timesCorrect: 0,
} as const;

export type CardSeed = {
  tokenIndex: number;
  answer: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lapses: number;
  timesSeen: number;
  timesCorrect: number;
  dueDate: Date;
};

export function buildCardSeeds(
  tokens: Token[],
  maskedIndices: number[],
  now: Date = new Date(),
): CardSeed[] {
  const unique = Array.from(new Set(maskedIndices)).sort((a, b) => a - b);
  return unique.map((index) => {
    const token = tokens[index];
    if (!token) throw new Error(`Token index ${index} is out of range.`);
    if (!token.maskable) throw new Error(`Token index ${index} is not maskable.`);
    return { tokenIndex: index, answer: token.text, dueDate: new Date(now.getTime()), ...SM2_DEFAULTS };
  });
}
