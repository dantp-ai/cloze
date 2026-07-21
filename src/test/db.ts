import { prisma } from "@/lib/db";

export async function resetDb(): Promise<void> {
  // Truncate all tables with CASCADE so FK order does not matter; resets isolation between tests.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "ReviewLog", "Card", "Translation", "Sentence", "Topic", "Workspace", "User" RESTART IDENTITY CASCADE',
  );
}
