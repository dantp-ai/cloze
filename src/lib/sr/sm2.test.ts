import { describe, it, expect } from "vitest";
import { review, DEFAULT_SR_PARAMS, type SRState } from "./sm2";

const P = DEFAULT_SR_PARAMS;
const NOW = new Date("2026-01-01T00:00:00.000Z");
const fresh: SRState = { easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0 };

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

describe("review (SM-2)", () => {
  it("defaults are sane and keep hard < good < easy growth", () => {
    expect(P.startingEase).toBe(2.5);
    expect(P.minEase).toBe(1.3);
    expect(P.hardMultiplier).toBeLessThan(P.minEase); // guarantees hard grows slower than good
  });

  it("grades a new card: hard < good < easy interval", () => {
    const hard = review(fresh, "hard", P, NOW);
    const good = review(fresh, "good", P, NOW);
    const easy = review(fresh, "easy", P, NOW);
    expect(hard.interval).toBeLessThan(good.interval);
    expect(good.interval).toBeLessThan(easy.interval);
    expect(good.repetitions).toBe(1);
    expect(daysBetween(NOW, good.dueDate)).toBe(good.interval);
  });

  it("good leaves ease unchanged; hard lowers it; easy raises it", () => {
    expect(review(fresh, "good", P, NOW).easeFactor).toBe(2.5);
    expect(review(fresh, "hard", P, NOW).easeFactor).toBeCloseTo(2.35, 5);
    expect(review(fresh, "easy", P, NOW).easeFactor).toBeCloseTo(2.65, 5);
  });

  it("grows a review card's interval by ease on good", () => {
    const state: SRState = { easeFactor: 2.5, interval: 10, repetitions: 3, lapses: 0 };
    const r = review(state, "good", P, NOW);
    expect(r.interval).toBe(25); // round(10 * 2.5 * 1.0)
    expect(r.repetitions).toBe(4);
  });

  it("again resets repetitions, lowers ease, increments lapses, and is due now", () => {
    const state: SRState = { easeFactor: 2.5, interval: 40, repetitions: 5, lapses: 1 };
    const r = review(state, "again", P, NOW);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(0);
    expect(r.lapses).toBe(2);
    expect(r.easeFactor).toBeCloseTo(2.3, 5);
    expect(daysBetween(NOW, r.dueDate)).toBe(0);
  });

  it("never lets ease fall below minEase", () => {
    const state: SRState = { easeFactor: 1.35, interval: 5, repetitions: 2, lapses: 0 };
    expect(review(state, "hard", P, NOW).easeFactor).toBe(P.minEase);
    expect(review(state, "again", P, NOW).easeFactor).toBe(P.minEase);
  });

  it("caps interval at maxInterval", () => {
    const state: SRState = { easeFactor: 2.5, interval: 10_000, repetitions: 9, lapses: 0 };
    expect(review(state, "good", P, NOW).interval).toBe(P.maxInterval);
  });
});
