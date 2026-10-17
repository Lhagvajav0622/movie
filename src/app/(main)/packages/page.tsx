import type { Metadata } from "next";
import { BackBar } from "@/components/catalog/DetailChrome";
import { BuyButton } from "@/components/payment/BuyButton";
import { getSession } from "@/server/auth";
import { includesText, listPackagesForSale } from "@/server/packages";

export const metadata: Metadata = { title: "Багц" };
export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" });
const money = (n: number) => `${n.toLocaleString("mn-MN")}₮`;

export default async function PackagesPage() {
  const session = await getSession().catch(() => null);
  const rows = await listPackagesForSale(session?.user.id).catch(() => []);
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5 px-4 pb-10 md:pt-8">
      <BackBar title="Багц" href="/" />
      <div>
        <h1 className="font-display text-[40px] font-bold leading-[48px]">Багц</h1>
        <p className="mt-1 text-body text-fg-muted">Нэг багцаар олон киног хязгааргүй үзээрэй.</p>
      </div>
      {rows.length === 0 && <p className="py-10 text-center text-body-2 text-fg-muted">Одоогоор зарагдаж буй багц алга.</p>}
      <ul className="flex flex-col gap-4">
        {rows.map((r) => {
          const inc = includesText(r);
          const saving = r.oldPriceMnt && r.oldPriceMnt > r.priceMnt;
          return (
            <li
              key={r.id}
              className={`flex flex-col gap-3 rounded-3xl border bg-surface p-6 ${
                r.highlighted ? "border-brand-500 shadow-glow" : "border-stroke"
              }`}
            >
              {(r.badge || r.activeUntil) && (
                <div className="flex flex-wrap gap-2">
                  {r.badge && (
                    <span className="rounded-full bg-brand-300 px-4 py-1.5 text-body-2 font-bold text-on-brand">{r.badge}</span>
                  )}
                  {r.activeUntil && (
                    <span className="rounded-full border border-brand-300 px-4 py-1.5 text-body-2 font-semibold text-brand-300">
                      Идэвхтэй · {fmt(r.activeUntil)} хүртэл
                    </span>
                  )}
                </div>
              )}
              <div>
                <h2 className="font-display text-[30px] font-bold leading-9">{r.name}</h2>
                <p className="mt-1 text-body text-fg-muted">{r.days} хоног</p>
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-[44px] font-bold leading-[48px] text-brand-300">{money(r.priceMnt)}</span>
                {saving && <span className="text-[20px] text-fg-subtle line-through">{money(r.oldPriceMnt!)}</span>}
              </div>
              {r.description && <p className="text-body text-fg-muted">{r.description}</p>}
              {inc && (
                <div>
                  <p className="text-caption text-fg-subtle">Багтсан ангилал</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {[...(r.allTitles ? ["Бүх кино (+18-аас бусад)"] : []), ...r.genreNames].map((n) => (
                      <span key={n} className="rounded-lg border border-stroke px-3 py-1 text-body-2">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <BuyButton
                packageId={r.id}
                days={r.days}
                includes={inc}
                priceMnt={r.priceMnt}
                label={r.activeUntil ? "Сунгах" : "Багц авах"}
                className="mt-1 h-12 w-full text-body"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
