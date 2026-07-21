import { describe, it, expect } from "vitest";
import { tokenize } from "@/lib/text/tokenize";
import { buildCardSeeds, SM2_DEFAULTS } from "./cards";

const tokens = tokenize("Oggi ho preso un caffè.");
// maskable token indices in this array: 0 (Oggi), 2 (ho), 4 (preso), 6 (un), 8 (caffè)

describe("buildCardSeeds", () => {
  it("builds one seed per masked index with SM-2 defaults and the token text as answer", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const seeds = buildCardSeeds(tokens, [4, 0], now);
    expect(seeds.map((s) => s.tokenIndex)).toEqual([0, 4]); // sorted
    expect(seeds[0].answer).toBe("Oggi");
    expect(seeds[1].answer).toBe("preso");
    expect(seeds[0]).toMatchObject(SM2_DEFAULTS);
    expect(seeds[0].dueDate).toEqual(now);
  });

  it("de-duplicates repeated indices", () => {
    expect(buildCardSeeds(tokens, [2, 2, 2]).map((s) => s.tokenIndex)).toEqual([2]);
  });

  it("throws when an index is out of range", () => {
    expect(() => buildCardSeeds(tokens, [99])).toThrow();
  });

  it("throws when an index points at a non-maskable token", () => {
    expect(() => buildCardSeeds(tokens, [1])).toThrow(); // index 1 is the space gap
  });
});
