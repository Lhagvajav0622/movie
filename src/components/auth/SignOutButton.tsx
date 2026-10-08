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
      className="h-11 rounded-lg border-[1.5px] border-red-500 px-5 text-body-2 font-medium text-red-500 hover:bg-red-500/10"
    >
      Гарах
    </button>
  );
}
