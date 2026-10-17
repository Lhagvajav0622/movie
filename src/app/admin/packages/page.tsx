import type { Metadata } from "next";
import { db, schema } from "@/server/db";
import { asc } from "drizzle-orm";
import { listPackagesAdmin, type PackageInfo } from "@/server/packages";
import { deletePackage, savePackage } from "./actions";

export const metadata: Metadata = { title: "Багц" };
export const dynamic = "force-dynamic";

const input =
  "h-10 w-full rounded-lg border border-stroke bg-surface px-3 text-body-2 outline-none focus:border-brand-400";
const label = "block text-caption text-fg-muted";

type Cat = { id: string; name: string };

function PackageForm({ p, cats }: { p?: PackageInfo; cats: Cat[] }) {
  return (
    <form action={savePackage} className="flex flex-col gap-3 p-4">
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          Нэр
          <input name="name" required maxLength={60} defaultValue={p?.name} placeholder="Жишээ: Сарын багц" className={input} />
        </label>
        <label className={label}>
          Шошго (заавал биш)
          <input name="badge" maxLength={30} defaultValue={p?.badge ?? ""} placeholder="Эрэлттэй, Хамгийн ашигтай…" className={input} />
        </label>
      </div>
      <label className={label}>
        Тайлбар (заавал биш)
        <input name="description" maxLength={300} defaultValue={p?.description ?? ""} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className={label}>
          Үнэ (₮)
          <input name="priceMnt" type="number" min={0} step={500} defaultValue={p?.priceMnt ?? 0} className={input} />
        </label>
        <label className={label}>
          Хуучин үнэ (зураастай)
          <input name="oldPriceMnt" type="number" min={0} step={500} defaultValue={p?.oldPriceMnt ?? ""} className={input} />
        </label>
        <label className={label}>
          Хоног
          <input name="days" type="number" min={1} defaultValue={p?.days ?? 30} className={input} />
        </label>
        <label className={label}>
          Дараалал
          <input name="sortOrder" type="number" min={0} defaultValue={p?.sortOrder ?? 0} className={input} />
        </label>
      </div>
      <fieldset>
        <legend className={label}>Ямар киноны эрх нээгдэх вэ?</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          <label className="cursor-pointer">
            <input type="checkbox" name="allTitles" defaultChecked={p?.allTitles} className="peer sr-only" />
            <span className="block rounded-lg border border-stroke px-3 py-1.5 text-body-2 text-fg-muted peer-checked:border-brand-400 peer-checked:bg-brand-500/20 peer-checked:text-fg">
              Бүх кино (+18-аас бусад)
            </span>
          </label>
          {cats.map((c) => (
            <label key={c.id} className="cursor-pointer">
              <input type="checkbox" name="genreIds" value={c.id} defaultChecked={p?.genreIds.includes(c.id)} className="peer sr-only" />
              <span className="block rounded-lg border border-stroke px-3 py-1.5 text-body-2 text-fg-muted peer-checked:border-brand-400 peer-checked:bg-brand-500/20 peer-checked:text-fg">
                {c.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-body-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Зарна (сайт дээр харагдана)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="highlighted" defaultChecked={p?.highlighted} /> Онцолсон (алтан хүрээ)
        </label>
      </div>
      <div className="flex gap-2">
        <button className="h-10 rounded-lg bg-brand-500 px-5 text-body-2 font-semibold text-on-brand hover:bg-brand-400">
          {p ? "Хадгалах" : "+ Багц нэмэх"}
        </button>
        {p && (
          <button
            formAction={deletePackage}
            formNoValidate
            className="h-10 rounded-lg border border-red-500/40 px-4 text-body-2 text-red-300 hover:bg-red-500/10"
          >
            Устгах
          </button>
        )}
      </div>
    </form>
  );
}

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const [{ msg, err }, rows, cats] = await Promise.all([
    searchParams,
    listPackagesAdmin(),
    db
      .select({ id: schema.genres.id, name: schema.genres.nameMn })
      .from(schema.genres)
      .orderBy(asc(schema.genres.sortOrder), asc(schema.genres.nameMn)),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-h4 font-bold">Багц</h1>
      <p className="mt-2 text-body-2 text-fg-muted">
        Багцыг өөрөө зохиож болно: нэр, үнэ, хоног тавиад, ямар ангиллын кинонууд орохыг сонгоно. Нэг багцад хэд ч ангилал
        оруулж болно. Худалдан авсан хүн тэдгээр ангиллын бүх киног хугацаанд нь үзнэ. Багцыг зарахгүй бол
        &quot;Зарна&quot;-г авна. +18 кино зөвхөн +18 ангилал сонгосон багцад орно.
      </p>
      {msg && <p className="mt-4 rounded-lg border border-brand-400/40 bg-brand-500/10 px-4 py-2.5 text-body-2">{msg}</p>}
      {err && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-body-2 text-red-300">{err}</p>}

      <div className="mt-6 divide-y divide-stroke rounded-2xl border border-stroke">
        {rows.map((p) => (
          <div key={p.id}>
            <p className="px-4 pt-3 text-body-2 font-semibold">
              {p.name}
              <span className="ml-2 text-caption font-normal text-fg-subtle">
                {p.active && p.priceMnt > 0 ? "зарагдаж байна" : "зарагдахгүй"}
              </span>
            </p>
            <PackageForm p={p} cats={cats} />
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-body font-bold">Шинэ багц</h2>
      <div className="mt-2 rounded-2xl border border-stroke">
        <PackageForm cats={cats} />
      </div>
    </div>
  );
}
