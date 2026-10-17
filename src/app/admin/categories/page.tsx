import type { Metadata } from "next";
import { listCategoriesAdmin, ADULT_SLUG } from "@/server/categories";
import {
  addCategory,
  deleteCategory,
  moveCategory,
  renameCategory,
} from "./actions";

export const metadata: Metadata = { title: "Ангилал" };

const input =
  "h-10 min-w-0 flex-1 rounded-lg border border-stroke bg-surface px-3 text-body-2 outline-none placeholder:text-fg-subtle focus:border-brand-400";
const btn =
  "h-10 shrink-0 rounded-lg border border-stroke px-3 text-body-2 text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const [{ msg, err }, rows] = await Promise.all([
    searchParams,
    listCategoriesAdmin(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-h4 font-bold">Ангилал</h1>
      <p className="mt-2 text-body-2 text-fg-muted">
        Сайтын &quot;Ангилал&quot; цэс болон бүтээл нэмэх үеийн жагсаалт эндээс
        бүрдэнэ. Дарааллыг сумаар солино. Бүтээлийг ангилалд нь бүтээлийн
        засварын хуудсан дээр оруулна.
      </p>

      {msg && (
        <p className="mt-4 rounded-lg border border-brand-400/40 bg-brand-500/10 px-4 py-2.5 text-body-2">
          {msg}
        </p>
      )}
      {err && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-body-2 text-red-300">
          {err}
        </p>
      )}

      <form action={addCategory} className="mt-6 flex gap-2">
        <input
          name="name"
          required
          maxLength={40}
          placeholder="Шинэ ангиллын нэр, жишээ нь: Адал явдалт кино"
          className={input}
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-lg bg-brand-500 text-on-brand px-4 text-body-2 font-semibold hover:bg-brand-400 text-on-brand"
        >
          + Нэмэх
        </button>
      </form>

      <ul className="mt-6 divide-y divide-stroke rounded-2xl border border-stroke">
        {rows.map((c, i) => {
          const locked = c.slug === ADULT_SLUG;
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-2 p-3">
              <div className="flex gap-1">
                <form action={moveCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button
                    className={btn}
                    disabled={i === 0}
                    aria-label="Дээш"
                    title="Дээш"
                  >
                    ↑
                  </button>
                </form>
                <form action={moveCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button
                    className={btn}
                    disabled={i === rows.length - 1}
                    aria-label="Доош"
                    title="Доош"
                  >
                    ↓
                  </button>
                </form>
              </div>

              {locked ? (
                <p className="min-w-0 flex-1 px-1 text-body font-semibold">
                  {c.name}{" "}
                  <span className="text-caption font-normal text-fg-subtle">
                    · насны хязгаартай, нэрийг солих боломжгүй
                  </span>
                </p>
              ) : (
                <form
                  action={renameCategory}
                  className="flex min-w-0 flex-1 gap-2"
                >
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    name="name"
                    defaultValue={c.name}
                    required
                    maxLength={40}
                    aria-label="Ангиллын нэр"
                    className={input}
                  />
                  <button className={btn}>Хадгалах</button>
                </form>
              )}

              <span className="w-16 shrink-0 text-right text-caption text-fg-subtle">
                {c.titleCount} бүтээл
              </span>

              {!locked && (
                <details className="relative">
                  <summary className={`${btn} flex cursor-pointer list-none items-center`}>
                    Устгах
                  </summary>
                  <form
                    action={deleteCategory}
                    className="absolute right-0 top-11 z-10 w-60 rounded-lg border border-stroke bg-surface p-3 shadow-xl"
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <p className="text-caption text-fg-muted">
                      &quot;{c.name}&quot; ангиллыг устгах уу? Бүтээлүүд
                      устахгүй, зөвхөн энэ ангиллаас хасагдана.
                    </p>
                    <button className="mt-2 h-9 w-full rounded-lg bg-red-600 text-body-2 font-semibold hover:bg-red-500">
                      Тийм, устгах
                    </button>
                  </form>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
