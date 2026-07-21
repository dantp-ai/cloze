"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/actions";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await logout();
        router.push("/login");
        router.refresh();
      }}
      className="rounded-md p-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      title="Log out"
    >
      Log out
    </button>
  );
}
