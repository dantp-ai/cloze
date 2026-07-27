import { describe, it, expect } from "vitest";
import { sessionOptions } from "./session";

describe("session options", () => {
  it("uses a stable cookie name", () => {
    expect(sessionOptions.cookieName).toBe("cloze_session");
  });

  it("reads its password from the environment", () => {
    expect(typeof sessionOptions.password).toBe("string");
    expect((sessionOptions.password as string).length).toBeGreaterThanOrEqual(32);
  });

  it("throws a helpful error when SESSION_SECRET is missing or too short", () => {
    const original = process.env.SESSION_SECRET;
    try {
      delete process.env.SESSION_SECRET;
      expect(() => sessionOptions.password).toThrow(/at least 32 characters/i);
      process.env.SESSION_SECRET = "too-short";
      expect(() => sessionOptions.password).toThrow(/at least 32 characters/i);
    } finally {
      process.env.SESSION_SECRET = original;
    }
  });
});
