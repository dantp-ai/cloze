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
});
