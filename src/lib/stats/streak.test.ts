import { describe, it, expect } from "vitest";
import { toDayKey, computeStreak, computeHeatmap } from "./streak";

const today = new Date(2026, 0, 15); // local midnight, Jan 15 2026
const d = (day: number) => new Date(2026, 0, day, 12, 0, 0);

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak([d(15), d(14), d(13), d(11)], today)).toBe(3);
  });

  it("stays alive when today has no review but yesterday does", () => {
    expect(computeStreak([d(14), d(13)], today)).toBe(2);
  });

  it("is zero when neither today nor yesterday has a review", () => {
    expect(computeStreak([d(10)], today)).toBe(0);
  });

  it("is zero for no reviews", () => {
    expect(computeStreak([], today)).toBe(0);
  });
});

describe("computeHeatmap", () => {
  it("returns one oldest-first cell per day with counts", () => {
    const cells = computeHeatmap([d(15), d(15), d(14)], 3, today);
    expect(cells).toEqual([
      { date: toDayKey(d(13)), count: 0 },
      { date: toDayKey(d(14)), count: 1 },
      { date: toDayKey(d(15)), count: 2 },
    ]);
  });
});
