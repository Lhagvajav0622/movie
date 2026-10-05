import Link from "next/link";
import type { Metadata } from "next";
import { listAllTitlesAdmin } from "@/server/catalog";

export const metadata: Metadata = { title: "Бүтээлүүд" };

export default async function AdminTitlesPage() {
  const rows = await listAllTitlesAdmin();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h4 font-bold">Бүтээлүүд</h1>
        <Link href="/admin/titles/new" className="rounded-lg bg-brand-500 px-4 py-2.5 text-body-2 font-semibold hover:bg-brand-400">
          + Шинэ бүтээл
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stroke p-10 text-center">
          <p className="text-body text-fg-muted">Бүтээл хараахан алга.</p>
          <Link href="/admin/titles/new" className="mt-3 inline-block text-brand-300 hover:underline">
            Эхний киногоо нэмэх
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-stroke rounded-2xl border border-stroke">
          {rows.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/titles/${t.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-surface">
                <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-surface-2">
                  {t.posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.posterUrl} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold">{t.name}</p>
                  <p className="text-caption text-fg-subtle">
                    {t.type === "series" ? "Цуврал" : "Кино"} · {t.orientation === "vertical" ? "Босоо" : "Хэвтээ"} ·{" "}
                    {t.episodeCount} анги
                  </p>
                </div>
                <span className="hidden text-body-2 text-fg-muted sm:block">
                  {t.priceMnt > 0 ? `${t.priceMnt.toLocaleString("mn-MN")}₮` : "Үнэгүй"}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-caption ${
                    t.status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-surface-2 text-fg-subtle"
                  }`}
                >
                  {t.status === "published" ? "Нийтэлсэн" : "Ноорог"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
