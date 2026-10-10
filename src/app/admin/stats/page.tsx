import Link from "next/link";
import type { Metadata } from "next";
import { getStats } from "@/server/stats";

export const metadata: Metadata = { title: "Статистик" };

const hours = (s: number) => {
  const h = s / 3600;
  return h >= 10 ? `${Math.round(h)} цаг` : `${Math.round(s / 60)} мин`;
};

export default async function Page() {
  const { totals, topTitles, topUsers } = await getStats();
  const cards: [string, string][] = [
    ["Хэрэглэгч", String(totals.users)],
    ["Нийтлэгдсэн бүтээл", String(totals.titles)],
    ["Худалдан авалт", String(totals.purchases)],
    ["Орлого (бодит)", `${totals.revenue.toLocaleString("en-US")}₮`],
    ["Нийт үзсэн хугацаа", hours(totals.watchSec)],
    ["Сүүлийн 7 хоногт үзсэн хүн", String(totals.activeWeek)],
  ];
  const th = "px-4 py-3";
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-h4 font-bold">Статистик</h1>
      <p className="mt-2 text-body-2 text-fg-muted">
        Үзсэн хугацаа нь хэрэглэгч бүрийн кино бүрт хүрсэн хамгийн сүүлийн
        байрлалаар (давтан үзсэнийг тусад нь тооцохгүй) бодогдсон ойролцоо тоо.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map(([k, v]) => (
          <div
            key={k}
            className="rounded-2xl border border-stroke bg-surface p-4"
          >
            <p className="text-caption text-fg-muted">{k}</p>
            <p className="mt-1 text-h4 font-bold">{v}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-[18px] font-bold">Их үзэгдсэн бүтээлүүд</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-stroke">
        <table className="w-full text-left text-body-2">
          <thead className="bg-surface text-fg-muted">
            <tr>
              <th className={th}>Бүтээл</th>
              <th className={th}>Үзсэн хүн</th>
              <th className={th}>Үзсэн хугацаа</th>
              <th className={th}>Дуусгасан</th>
              <th className={th}>Худалдан авсан</th>
            </tr>
          </thead>
          <tbody>
            {topTitles.map((t) => (
              <tr key={t.id} className="border-t border-stroke">
                <td className={th}>
                  <Link
                    href={`/admin/titles/${t.id}`}
                    className="hover:text-brand-300"
                  >
                    {t.name}
                  </Link>
                </td>
                <td className={th}>{t.viewers}</td>
                <td className={th}>{hours(t.watchSec)}</td>
                <td className={th}>{t.finished}</td>
                <td className={th}>{t.sales}</td>
              </tr>
            ))}
            {topTitles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-fg-muted">
                  Одоогоор үзсэн мэдээлэл алга.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-[18px] font-bold">
        Хамгийн их үзсэн хэрэглэгчид
      </h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-stroke">
        <table className="w-full text-left text-body-2">
          <thead className="bg-surface text-fg-muted">
            <tr>
              <th className={th}>Хэрэглэгч</th>
              <th className={th}>Үзсэн кино</th>
              <th className={th}>Үзсэн хугацаа</th>
              <th className={th}>Сүүлд үзсэн</th>
            </tr>
          </thead>
          <tbody>
            {topUsers.map((u) => (
              <tr key={u.id} className="border-t border-stroke">
                <td className={th}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="hover:text-brand-300"
                  >
                    {u.phone ?? u.name}
                  </Link>
                </td>
                <td className={th}>{u.titles}</td>
                <td className={th}>{hours(u.watchSec)}</td>
                <td className={th}>
                  {new Date(u.last).toLocaleString("mn-MN", {
                    timeZone: "Asia/Ulaanbaatar",
                  })}
                </td>
              </tr>
            ))}
            {topUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-fg-muted">
                  Одоогоор үзсэн мэдээлэл алга.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
