import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const metadata: Metadata = { title: "Профайл" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/profile");
  const u = session.user as typeof session.user & { phoneNumber?: string | null; role?: string };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 md:px-10">
      <h1 className="text-h4 font-bold">Профайл</h1>

      <section className="mt-6 flex items-center gap-4 rounded-2xl border border-stroke bg-surface p-5">
        <div className="grid size-14 place-items-center rounded-full bg-brand-500 text-xl font-bold">
          {u.name?.trim()?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold">{u.name}</p>
          <p className="text-body-2 text-fg-muted">{u.phoneNumber ?? u.email}</p>
          <p className="text-caption text-fg-subtle">ID: {u.id.slice(0, 8)}</p>
        </div>
        {u.role === "admin" && (
          <span className="rounded bg-brand-500/20 px-2 py-1 text-caption text-brand-300">Админ</span>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-stroke bg-surface p-5">
        <h2 className="text-body font-semibold">Миний кинонууд</h2>
        <p className="mt-2 text-body-2 text-fg-muted">Худалдаж авсан кино одоогоор алга.</p>
      </section>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
