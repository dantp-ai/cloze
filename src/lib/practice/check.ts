export type CheckOptions = { caseSensitive: boolean; accentSensitive: boolean };

export const DEFAULT_CHECK_OPTIONS: CheckOptions = {
  caseSensitive: false,
  accentSensitive: false,
};

function normalize(value: string, opts: CheckOptions): string {
  let out = value.trim();
  if (!opts.caseSensitive) out = out.toLowerCase();
  if (!opts.accentSensitive) out = out.normalize("NFD").replace(/\p{M}/gu, "");
  return out;
}

export function checkAnswer(input: string, answer: string, opts: CheckOptions): boolean {
  return normalize(input, opts) === normalize(answer, opts);
}
