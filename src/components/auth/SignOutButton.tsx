"use client";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
      className="h-11 rounded-lg border border-stroke px-5 text-body-2 text-fg-muted hover:text-fg"
    >
      Гарах
    </button>
  );
}
