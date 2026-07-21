import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  return userId;
}
