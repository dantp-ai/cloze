import { describe, it, expect, beforeEach, vi, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";

// In-memory session stand-in shared across the mocked module.
const fakeSession: { userId?: string; save: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> } = {
  userId: undefined,
  save: vi.fn(async () => {}),
  destroy: vi.fn(async () => {
    fakeSession.userId = undefined;
  }),
};

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => fakeSession,
}));

import { signup, login, logout, userExists } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("auth actions", () => {
  beforeEach(async () => {
    await resetDb();
    fakeSession.userId = undefined;
    fakeSession.save.mockClear();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("reports no user before signup", async () => {
    expect(await userExists()).toBe(false);
  });

  it("signs up the first user and sets the session", async () => {
    const res = await signup(form({ email: "me@example.com", password: "hunter2xx" }));
    expect(res).toEqual({ ok: true });
    expect(await userExists()).toBe(true);
    expect(fakeSession.userId).toBeDefined();
    expect(fakeSession.save).toHaveBeenCalled();
  });

  it("refuses a second signup", async () => {
    await signup(form({ email: "me@example.com", password: "hunter2xx" }));
    const res = await signup(form({ email: "other@example.com", password: "hunter2xx" }));
    expect(res).toEqual({ ok: false, error: "An account already exists." });
  });

  it("logs in with correct credentials", async () => {
    await signup(form({ email: "me@example.com", password: "hunter2xx" }));
    fakeSession.userId = undefined;
    const res = await login(form({ email: "me@example.com", password: "hunter2xx" }));
    expect(res).toEqual({ ok: true });
    expect(fakeSession.userId).toBeDefined();
  });

  it("rejects a wrong password", async () => {
    await signup(form({ email: "me@example.com", password: "hunter2xx" }));
    const res = await login(form({ email: "me@example.com", password: "nope" }));
    expect(res).toEqual({ ok: false, error: "Invalid email or password." });
  });

  it("normalizes email so login matches signup regardless of case/whitespace", async () => {
    await signup(form({ email: "Me@Example.com", password: "hunter2xx" }));
    fakeSession.userId = undefined;
    const res = await login(form({ email: "me@example.com", password: "hunter2xx" }));
    expect(res).toEqual({ ok: true });
    expect(fakeSession.userId).toBeDefined();
  });
});
