import { describe, it, expect } from "vitest";
import { tokenize } from "@/lib/text/tokenize";
import { maskedPreview } from "./render";

describe("maskedPreview", () => {
  it("replaces masked words with same-length underscore runs", () => {
    const tokens = tokenize("Oggi ho preso un caffè.");
    expect(maskedPreview(tokens, [4])).toBe("Oggi ho _____ un caffè.");
  });

  it("returns the original text when nothing is masked", () => {
    const tokens = tokenize("Ciao mondo.");
    expect(maskedPreview(tokens, [])).toBe("Ciao mondo.");
  });
});
