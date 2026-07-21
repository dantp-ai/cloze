export function pickDistractors(answer: string, pool: string[], count: number): string[] {
  const answerLower = answer.trim().toLowerCase();

  const seen = new Set<string>([answerLower]);
  const unique: string[] = [];
  for (const raw of pool) {
    const word = raw.trim();
    const key = word.toLowerCase();
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    unique.push(word);
  }

  unique.sort((a, b) => {
    const da = Math.abs(a.length - answer.length);
    const db = Math.abs(b.length - answer.length);
    if (da !== db) return da - db;
    return a.localeCompare(b);
  });

  return unique.slice(0, Math.max(0, count));
}
