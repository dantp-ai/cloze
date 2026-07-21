import { describe, it, expect } from "vitest";
import { tokenize } from "./tokenize";

describe("tokenize", () => {
  it("splits a sentence into word and gap tokens", () => {
    const tokens = tokenize("Oggi ho preso un caffè.");
    const words = tokens.filter((t) => t.maskable).map((t) => t.text);
    expect(words).toEqual(["Oggi", "ho", "preso", "un", "caffè"]);
  });

  it("is lossless - joining tokens reproduces the input", () => {
    const input = "  Oggi ho preso un caffè!  ";
    expect(tokenize(input).map((t) => t.text).join("")).toBe(input);
  });

  it("keeps an apostrophe inside a single word token", () => {
    const tokens = tokenize("Bevo l'acqua.");
    const words = tokens.filter((t) => t.maskable).map((t) => t.text);
    expect(words).toEqual(["Bevo", "l'acqua"]);
  });

  it("keeps a typographic (curly) apostrophe inside a single word token", () => {
    const words = tokenize("Bevo l’acqua.").filter((t) => t.maskable).map((t) => t.text);
    expect(words).toEqual(["Bevo", "l’acqua"]);
  });

  it("marks punctuation-only and whitespace segments as not maskable", () => {
    const tokens = tokenize("Ciao, mondo.");
    expect(tokens.every((t) => (t.maskable ? /\p{L}/u.test(t.text) : true))).toBe(true);
    expect(tokens.some((t) => !t.maskable && t.text === ", ")).toBe(true);
  });

  it("returns an empty array for an empty string", () => {
    expect(tokenize("")).toEqual([]);
  });
});
