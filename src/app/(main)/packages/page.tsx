import type { Metadata } from "next";
import { BackBar } from "@/components/catalog/DetailChrome";
import { BuyButton } from "@/components/payment/BuyButton";
import { getSession } from "@/server/auth";
import { listPackagesForSale } from "@/server/packages";

export const metadata: Metadata = { title: "Багц" };
export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" });

export default async function PackagesPage() {
  const session = await getSession().catch(() => null);
  const rows = await listPackagesForSale(session?.user.id).catch(() => []);
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 pb-10 md:pt-8">
      <BackBar title="Багц" href="/" />
      <h1 className="hidden text-[28px] font-bold leading-9 md:block">Багц</h1>
      <p className="text-body-2 text-fg-muted">
        Нэг багц авч, хугацаанд нь тухайн ангиллын бүх киног хязгааргүй үзээрэй.
      </p>
      {rows.length === 0 && <p className="py-10 text-center text-body-2 text-fg-muted">Одоогоор зарагдаж буй багц алга.</p>}
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stroke bg-surface p-4">
            <div>
              <p className="text-body font-bold">{r.name}</p>
              <p className="text-body-2 text-fg-muted">
                {r.days} хоног · {r.priceMnt.toLocaleString("mn-MN")}₮
              </p>
              {r.activeUntil && <p className="mt-1 text-caption text-brand-300">Идэвхтэй · {fmt(r.activeUntil)} хүртэл</p>}
            </div>
            <BuyButton
              packageId={r.id}
              days={r.days}
              priceMnt={r.priceMnt}
              label={r.activeUntil ? "Сунгах" : "Багц авах"}
              className="h-11 px-5 text-body-2"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
