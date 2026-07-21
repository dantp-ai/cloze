import { describe, it, expect } from "vitest";
import { classifyCard, masteryDistribution, MATURE_INTERVAL_DAYS } from "./mastery";

describe("classifyCard", () => {
  it("classifies a never-seen card as new", () => {
    expect(classifyCard({ timesSeen: 0, interval: 0 })).toBe("new");
  });

  it("classifies a seen short-interval card as learning", () => {
    expect(classifyCard({ timesSeen: 3, interval: 5 })).toBe("learning");
  });

  it("classifies a long-interval card as mature", () => {
    expect(classifyCard({ timesSeen: 9, interval: MATURE_INTERVAL_DAYS })).toBe("mature");
  });
});

describe("masteryDistribution", () => {
  it("counts cards per bucket", () => {
    expect(
      masteryDistribution([
        { timesSeen: 0, interval: 0 },
        { timesSeen: 2, interval: 3 },
        { timesSeen: 5, interval: 40 },
        { timesSeen: 1, interval: 100 },
      ]),
    ).toEqual({ new: 1, learning: 1, mature: 2 });
  });
});
