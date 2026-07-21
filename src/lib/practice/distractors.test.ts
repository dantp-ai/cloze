import { describe, it, expect } from "vitest";
import { pickDistractors } from "./distractors";

describe("pickDistractors", () => {
  it("prefers words closest in length to the answer", () => {
    const pool = ["a", "bevo", "tiny", "elephants", "cane"];
    // answer "preso" (5). closest lengths: bevo(4), tiny(4), cane(4) then elephants(9)...
    const picks = pickDistractors("preso", pool, 2);
    expect(picks).toHaveLength(2);
    expect(picks).not.toContain("preso");
    // the two length-4 words nearest 5, ties broken alphabetically -> "bevo", "cane"
    expect(picks).toEqual(["bevo", "cane"]);
  });

  it("excludes the answer case-insensitively and de-duplicates", () => {
    const picks = pickDistractors("Preso", ["preso", "PRESO", "bevo", "bevo"], 5);
    expect(picks).toEqual(["bevo"]);
  });

  it("returns fewer than count when the pool is too small", () => {
    expect(pickDistractors("x", ["y"], 3)).toEqual(["y"]);
  });

  it("returns an empty array for an empty pool", () => {
    expect(pickDistractors("x", [], 3)).toEqual([]);
  });
});
