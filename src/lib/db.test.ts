import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "./db";
import { resetDb } from "@/test/db";

describe("prisma client", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates and reads a user", async () => {
    const user = await prisma.user.create({
      data: { email: "me@example.com", passwordHash: "x" },
    });
    const found = await prisma.user.findUnique({ where: { id: user.id } });
    expect(found?.email).toBe("me@example.com");
  });
});
