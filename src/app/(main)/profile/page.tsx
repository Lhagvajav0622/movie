import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, requireAdmin } from "@/server/auth";
import { listPurchased } from "@/server/library";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { MediaListItem, typeLabel } from "@/components/catalog/MediaListItem";
import { IconBookmark, IconChevronRightSm, IconUser } from "@/components/ui/icons";

const IconClock = ({ className }: { className?: string }) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const metadata: Metadata = { title: "Профайл" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/profile");
  const u = session.user as typeof session.user & { phoneNumber?: string | null };
  const [owned, admin] = await Promise.all([listPurchased(u.id), requireAdmin()]);

  // Accounts created by phone only have the phone number as their name: show a friendly label instead of repeating it.
  const hasName = Boolean(u.name?.trim()) && u.name !== u.phoneNumber;
  const initial = hasName ? u.name.trim()[0].toUpperCase() : null;

  const menu = [
    { href: "/saved", label: "Хадгалсан", Icon: IconBookmark },
    { href: "/history", label: "Үзсэн түүх", Icon: IconClock },
    ...(admin ? [{ href: "/admin/titles", label: "Админ", Icon: IconUser }] : []),
  ];

  return (
    <div className="mx-auto max-w-[720px] px-4 pt-6">
      <h1 className="text-[20px] font-bold leading-7 md:text-h4">Профайл</h1>

      <section className="mt-5 flex items-center gap-4 rounded-2xl border border-stroke bg-surface p-5">
        <div className="grid size-14 place-items-center rounded-full bg-brand-500 text-xl font-bold">
          {initial && /\p{L}/u.test(initial) ? initial : <IconUser size={28} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold">{hasName ? u.name : (u.phoneNumber ?? u.email)}</p>
          {hasName && <p className="text-body-2 text-fg-muted">{u.phoneNumber ?? u.email}</p>}
          <p className="text-caption text-fg-subtle">ID: {u.id.slice(0, 8)}</p>
        </div>
      </section>

      <nav className="mt-5 divide-y divide-stroke overflow-hidden rounded-2xl border border-stroke">
        {menu.map(({ Icon, ...m }) => (
          <Link key={m.href} href={m.href} className="flex items-center gap-3 px-5 py-4 hover:bg-surface">
            <Icon className="text-fg-muted" />
            <span className="flex-1 text-body">{m.label}</span>
            <IconChevronRightSm className="text-fg-muted" />
          </Link>
        ))}
      </nav>

      <section className="mt-8">
        <h2 className="mb-3 text-[15px] font-semibold leading-6 md:text-[20px]">Миний кинонууд</h2>
        {owned.length ? (
          <ul className="flex flex-col gap-4">
            {owned.map((t) => (
              <MediaListItem
                key={t.id}
                href={`/title/${t.slug}`}
                t={t}
                meta={[t.year, typeLabel(t.type)].filter(Boolean).join(" • ")}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-stroke p-5 text-body-2 text-fg-muted">
            Худалдаж авсан кино одоогоор алга. Авсан кинонууд энд хугацаагүй хадгалагдана.
          </p>
        )}
      </section>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
