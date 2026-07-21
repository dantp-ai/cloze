export type Token = { text: string; maskable: boolean };

// A word is a letter followed by letters, combining marks, apostrophes, or hyphens.
const WORD_RE = /\p{L}[\p{L}\p{M}'’-]*/gu;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(WORD_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, start), maskable: false });
    }
    tokens.push({ text: match[0], maskable: true });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), maskable: false });
  }
  return tokens;
}
