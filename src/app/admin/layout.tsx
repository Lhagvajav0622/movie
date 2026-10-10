import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession, requireAdmin } from "@/server/auth";

export const metadata: Metadata = {
  title: { default: "Админ", template: "%s · Админ" },
};

const nav = [
  { href: "/admin/titles", label: "Бүтээлүүд" },
  { href: "/admin/orders", label: "Захиалга" },
  { href: "/admin/users", label: "Хэрэглэгчид" },
  { href: "/admin/stats", label: "Статистик" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/titles");
  if (!(await requireAdmin())) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-h4 font-bold">Админ эрх алга</h1>
        <p className="mt-3 text-body-2 text-fg-muted">
          Энэ хэсэг зөвхөн админд нээлттэй. Эрх авах бол системийн эзэмшигчид
          хандана уу.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-brand-300 hover:underline"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-b border-stroke bg-surface md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <Link href="/" className="text-xl font-bold">
            Mhub{" "}
            <span className="text-body-2 font-medium text-brand-300">
              админ
            </span>
          </Link>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="shrink-0 rounded-lg px-3 py-2 text-body-2 text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
