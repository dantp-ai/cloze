import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";
import { userExists } from "@/lib/auth/actions";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getCurrentUserId()) redirect("/workspaces");
  const exists = await userExists();
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Cloze</h1>
      <LoginForm mode={exists ? "login" : "signup"} />
    </main>
  );
}
