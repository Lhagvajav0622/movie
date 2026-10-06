"use client";
import { useActionState, useState } from "react";
import { saveTitle, type TitleFormState } from "@/app/admin/actions";
import { slugify } from "@/lib/slug";
import { ImageUpload } from "./ImageUpload";

type Genre = { id: string; nameMn: string };
export type TitleFormValues = {
  id?: string;
  name?: string;
  slug?: string;
  nameOriginal?: string | null;
  description?: string | null;
  type?: "film" | "series";
  orientation?: "vertical" | "horizontal";
  year?: number | null;
  ageRating?: string | null;
  country?: string | null;
  director?: string | null;
  castText?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  priceMnt?: number;
  freePreviewSec?: number;
  isFeatured?: boolean;
  status?: "draft" | "published";
  genreIds?: string[];
};

const input =
  "h-11 w-full rounded-lg border border-stroke bg-surface px-3 text-body-2 outline-none placeholder:text-fg-subtle focus:border-brand-400";

function L({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-body-2 font-medium text-fg-muted">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-caption text-fg-subtle">{hint}</span>
      )}
    </label>
  );
}

export function TitleForm({
  genres,
  initial = {},
}: {
  genres: Genre[];
  initial?: TitleFormValues;
}) {
  const [state, action, pending] = useActionState<TitleFormState, FormData>(
    saveTitle,
    undefined,
  );
  const [name, setName] = useState(initial.name ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [type, setType] = useState(initial.type ?? "film");
  const [poster, setPoster] = useState(initial.posterUrl ?? "");
  const [backdrop, setBackdrop] = useState(initial.backdropUrl ?? "");

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_220px]">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-stroke p-5">
          <h2 className="text-body font-semibold">Үндсэн мэдээлэл</h2>
          <L label="Нэр *">
            <input
              name="name"
              required
              className={input}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Эх нэр" hint="Хятад эсвэл англи нэр (хайлтад ашиглана)">
              <input
                name="nameOriginal"
                defaultValue={initial.nameOriginal ?? ""}
                className={input}
              />
            </L>
            <L label="Хаяг (URL)" hint={`/title/${slug || "..."}`}>
              <input
                name="slug"
                className={input}
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
              />
            </L>
          </div>
          <L label="Тайлбар">
            <textarea
              name="description"
              rows={4}
              defaultValue={initial.description ?? ""}
              className={`${input} h-auto py-2.5`}
            />
          </L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Төрөл">
              <select
                name="type"
                className={input}
                value={type}
                onChange={(e) => setType(e.target.value as "film" | "series")}
              >
                <option value="film">Кино (нэг видео)</option>
                <option value="series">Цуврал (олон анги)</option>
              </select>
            </L>
            <L label="Харагдах чиглэл" hint="Хятад богино драм бол «Босоо»">
              <select
                name="orientation"
                defaultValue={
                  initial.orientation ??
                  (type === "series" ? "vertical" : "horizontal")
                }
                className={input}
              >
                <option value="horizontal">Хэвтээ (16:9)</option>
                <option value="vertical">Босоо (9:16, reel)</option>
              </select>
            </L>
          </div>
          <div>
            <span className="mb-1.5 block text-body-2 font-medium text-fg-muted">
              Жанр
            </span>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <label key={g.id} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="genreIds"
                    value={g.id}
                    defaultChecked={initial.genreIds?.includes(g.id)}
                    className="peer sr-only"
                  />
                  <span className="block rounded-lg border border-stroke px-3 py-1.5 text-body-2 text-fg-muted peer-checked:border-brand-400 peer-checked:bg-brand-500/20 peer-checked:text-fg">
                    {g.nameMn}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-stroke p-5">
          <h2 className="text-body font-semibold">Үнэ ба үнэгүй хэсэг</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Үнэ (₮)" hint="0 бол бүхэлдээ үнэгүй">
              <input
                name="priceMnt"
                type="number"
                min={0}
                step={100}
                defaultValue={initial.priceMnt ?? 4000}
                className={input}
              />
            </L>
            <L
              label="Үнэгүй үзэх (минут)"
              hint={
                type === "series"
                  ? "1-р ангиас эхлэн нийлбэрээр тооцно"
                  : "Киноны эхний хэсэг"
              }
            >
              <input
                name="freePreviewMin"
                type="number"
                min={0}
                step={0.5}
                defaultValue={
                  initial.freePreviewSec != null
                    ? initial.freePreviewSec / 60
                    : 5
                }
                className={input}
              />
            </L>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-stroke p-5">
          <h2 className="text-body font-semibold">Дэлгэрэнгүй</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <L label="Он">
              <input
                name="year"
                type="number"
                min={1900}
                max={2100}
                defaultValue={initial.year ?? ""}
                className={input}
              />
            </L>
            <L label="Насны ангилал">
              <select
                name="ageRating"
                defaultValue={initial.ageRating ?? ""}
                className={input}
              >
                <option value="">—</option>
                <option>+7</option>
                <option>+13</option>
                <option>+16</option>
                <option>+18</option>
              </select>
            </L>
            <L label="Улс">
              <input
                name="country"
                defaultValue={initial.country ?? ""}
                placeholder="Хятад"
                className={input}
              />
            </L>
          </div>
          <L label="Найруулагч">
            <input
              name="director"
              defaultValue={initial.director ?? ""}
              className={input}
            />
          </L>
          <L label="Жүжигчид" hint="Таслалаар тусгаарлана">
            <input
              name="castText"
              defaultValue={initial.castText ?? ""}
              className={input}
            />
          </L>
        </section>

        <section className="space-y-4 rounded-2xl border border-stroke p-5">
          <h2 className="text-body font-semibold">Зураг</h2>
          <L
            label="Постер"
            hint="2:3 харьцаатай зураг. Сонгоод автоматаар жижигрүүлж хадгална, эсвэл холбоос шууд оруулж болно."
          >
            <ImageUpload maxWidth={800} onChange={setPoster} />
            <input
              name="posterUrl"
              type="url"
              value={poster}
              onChange={(e) => setPoster(e.target.value)}
              placeholder="https://..."
              className={`${input} mt-2`}
            />
          </L>
          <L label="Арын зураг" hint="16:9, нүүрний баннерт">
            <ImageUpload maxWidth={1600} onChange={setBackdrop} />
            <input
              name="backdropUrl"
              type="url"
              value={backdrop}
              onChange={(e) => setBackdrop(e.target.value)}
              placeholder="https://..."
              className={`${input} mt-2`}
            />
          </L>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="aspect-[2/3] overflow-hidden rounded-lg border border-stroke bg-surface">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center p-4 text-center text-caption text-fg-subtle">
              Постер энд харагдана
            </div>
          )}
        </div>
        <L label="Төлөв">
          <select
            name="status"
            defaultValue={initial.status ?? "draft"}
            className={input}
          >
            <option value="draft">Ноорог (харагдахгүй)</option>
            <option value="published">Нийтлэх</option>
          </select>
        </L>
        <label className="flex items-center gap-2 text-body-2 text-fg-muted">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={initial.isFeatured}
            className="size-4 accent-brand-500"
          />
          Нүүрэнд онцлох
        </label>
        {state?.error && (
          <p className="text-body-2 text-danger">{state.error}</p>
        )}
        {state?.ok && (
          <p className="text-body-2 text-emerald-400">Хадгаллаа.</p>
        )}
        {!initial.id && (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-caption text-fg-muted">
            Эхлээд хадгална. Хадгалсны дараа энэ хуудсанд «Ангиуд» хэсэг гарч,
            анги нэмээд MP4 файлаа оруулна.
          </p>
        )}
        <button
          disabled={pending}
          className="h-11 w-full rounded-lg bg-brand-500 text-body-2 font-semibold hover:bg-brand-400 disabled:opacity-50"
        >
          {pending ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </aside>
    </form>
  );
}
