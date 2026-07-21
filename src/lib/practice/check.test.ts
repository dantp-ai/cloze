import { describe, it, expect } from "vitest";
import { checkAnswer, DEFAULT_CHECK_OPTIONS } from "./check";

const D = DEFAULT_CHECK_OPTIONS;

describe("checkAnswer", () => {
  it("is case- and accent-insensitive by default, ignoring surrounding spaces", () => {
    expect(checkAnswer("  Caffe ", "caffè", D)).toBe(true);
    expect(checkAnswer("PRESO", "preso", D)).toBe(true);
  });

  it("rejects a wrong word", () => {
    expect(checkAnswer("tè", "caffè", D)).toBe(false);
  });

  it("respects case sensitivity when enabled", () => {
    const opts = { caseSensitive: true, accentSensitive: false };
    expect(checkAnswer("preso", "Preso", opts)).toBe(false);
    expect(checkAnswer("Preso", "Preso", opts)).toBe(true);
  });

  it("respects accent sensitivity when enabled", () => {
    const opts = { caseSensitive: false, accentSensitive: true };
    expect(checkAnswer("caffe", "caffè", opts)).toBe(false);
    expect(checkAnswer("caffè", "caffè", opts)).toBe(true);
  });
});
