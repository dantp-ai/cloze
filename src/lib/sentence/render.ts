import type { Token } from "@/lib/text/tokenize";

export function maskedPreview(tokens: Token[], maskedIndices: number[]): string {
  const masked = new Set(maskedIndices);
  return tokens
    .map((token, index) => (masked.has(index) ? "_".repeat(token.text.length) : token.text))
    .join("");
}
