import { prisma } from "@/lib/db";

export async function userExists(): Promise<boolean> {
  const count = await prisma.user.count();
  return count > 0;
}
