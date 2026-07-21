"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";
import { getOwnedWorkspace } from "@/lib/workspace/queries";

export type TopicResult = { ok: true; id: string } | { ok: false; error: string };

const nameSchema = z.string().trim().min(1);

export async function createTopic(workspaceId: string, name: string): Promise<TopicResult> {
  const userId = await requireUserId();
  const parsedName = nameSchema.safeParse(name);
  if (!parsedName.success) return { ok: false, error: "Topic name is required." };
  const workspace = await getOwnedWorkspace(userId, workspaceId);
  if (!workspace) return { ok: false, error: "Workspace not found." };
  const topic = await prisma.topic.create({
    data: { workspaceId, name: parsedName.data },
  });
  return { ok: true, id: topic.id };
}

export async function renameTopic(topicId: string, name: string): Promise<TopicResult> {
  const userId = await requireUserId();
  const parsedName = nameSchema.safeParse(name);
  if (!parsedName.success) return { ok: false, error: "Topic name is required." };
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic || !(await getOwnedWorkspace(userId, topic.workspaceId))) {
    return { ok: false, error: "Topic not found." };
  }
  await prisma.topic.update({ where: { id: topicId }, data: { name: parsedName.data } });
  return { ok: true, id: topicId };
}

export async function deleteTopic(topicId: string): Promise<void> {
  const userId = await requireUserId();
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic || !(await getOwnedWorkspace(userId, topic.workspaceId))) return;
  await prisma.topic.delete({ where: { id: topicId } });
}
