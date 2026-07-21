import type { Topic } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listTopics(workspaceId: string): Promise<Topic[]> {
  return prisma.topic.findMany({
    where: { workspaceId },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}
