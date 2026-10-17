import type { Metadata } from "next";
import { listPackagesAdmin } from "@/server/packages";
import { savePackage } from "./actions";

export const metadata: Metadata = { title: "Багц" };
export const dynamic = "force-dynamic";

const input =
  "h-10 w-full rounded-lg border border-stroke bg-surface px-3 text-body-2 outline-none focus:border-brand-400";

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const [{ msg, err }, rows] = await Promise.all([searchParams, listPackagesAdmin()]);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-h4 font-bold">Багц</h1>
      <p className="mt-2 text-body-2 text-fg-muted">
        Багц бүрийн үнэ ба хугацаагаа тавина. Худалдан авсны дараа хэрэглэгч тухайн ангиллын бүх киног хугацаанд нь
        үзнэ. <b>Үнэ 0 байвал багц зарагдахгүй</b> (сайт дээр харагдахгүй). &quot;Бүх багц&quot; нь +18-аас бусад бүх
        киног, +18 багц нь зөвхөн +18 киног нээнэ.
      </p>
      {msg && <p className="mt-4 rounded-lg border border-brand-400/40 bg-brand-500/10 px-4 py-2.5 text-body-2">{msg}</p>}
      {err && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-body-2 text-red-300">{err}</p>}
      <ul className="mt-6 divide-y divide-stroke rounded-2xl border border-stroke">
        {rows.map((r) => (
          <li key={r.genreId ?? "all"}>
            <form action={savePackage} className="flex flex-wrap items-end gap-3 p-3">
              <input type="hidden" name="genreId" value={r.genreId ?? ""} />
              <div className="min-w-[160px] flex-1 font-semibold">
                {r.name}
                <span className="ml-2 text-caption font-normal text-fg-subtle">{r.priceMnt > 0 ? "зарагдаж байна" : "зарагдахгүй"}</span>
              </div>
              <label className="w-32 text-caption text-fg-muted">
                Үнэ (₮)
                <input name="priceMnt" type="number" min={0} step={1000} defaultValue={r.priceMnt} className={input} />
              </label>
              <label className="w-24 text-caption text-fg-muted">
                Хоног
                <input name="days" type="number" min={1} defaultValue={r.days} className={input} />
              </label>
              <button className="h-10 rounded-lg bg-brand-500 px-4 text-body-2 font-semibold text-on-brand hover:bg-brand-400">
                Хадгалах
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
