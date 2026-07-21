"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, signup, type AuthResult } from "@/lib/auth/actions";

export function LoginForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const action = mode === "signup" ? signup : login;
    try {
      const result: AuthResult = await action(formData);
      if (result.ok) {
        router.push("/workspaces");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        aria-label="Email"
        autoComplete="username"
        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700"
      />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        placeholder="Password"
        aria-label="Password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {mode === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
