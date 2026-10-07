import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { BackBar } from "@/components/catalog/DetailChrome";
import { SearchBox } from "@/components/catalog/SearchBox";
import { TitleCard, type TitleCardData } from "@/components/catalog/TitleCard";
import { TitleRow } from "@/components/catalog/TitleRow";
import { countPublished, listGenres, searchTitles } from "@/server/catalog";
import { demoGenres, demoTitles } from "@/lib/demo";

export const metadata: Metadata = { title: "Хайх" };

function hueFrom(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

async function loadUncached(q: string, genre: string | null) {
  try {
    if ((await countPublished()) > 0) {
      const [rows, genres] = await Promise.all([
        searchTitles(q, genre),
        listGenres(),
      ]);
      const items: TitleCardData[] = rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        year: r.year,
        posterUrl: r.posterUrl,
        priceMnt: r.priceMnt,
        hue: hueFrom(r.slug),
      }));
      return { items, genres: genres.map((g) => g.nameMn) };
    }
  } catch {
    /* fall through to demo */
  }
  const needle = q.trim().toLowerCase();
  const items = demoTitles.filter(
    (t) =>
      (!needle || t.name.toLowerCase().includes(needle)) &&
      (!genre || t.genres.includes(genre)),
  );
  return { items, genres: demoGenres };
}

// Browsing (no text typed) is the same for everyone: keep it for a minute. Admin edits clear it (tag "catalog").
const loadBrowse = unstable_cache(loadUncached, ["search-browse"], {
  tags: ["catalog"],
  revalidate: 60,
});
const load = (q: string, genre: string | null) =>
  q.trim() ? loadUncached(q, genre) : loadBrowse(q, genre);

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const genre = typeof sp.genre === "string" && sp.genre ? sp.genre : null;
  const { items, genres } = await load(q, genre);
  const browsing = !q.trim() && !genre;

  const chip = (label: string, value: string | null) => {
    const active = value === genre;
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (value) p.set("genre", value);
    return (
      <Link
        key={label}
        href={`/search${p.size ? `?${p}` : ""}`}
        scroll={false}
        className={`shrink-0 rounded-lg border-[1.5px] px-4 py-2 text-[14px] font-medium leading-6 ${
          active
            ? "border-brand-300 bg-brand-500"
            : "border-stroke bg-black text-fg"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-4 md:gap-6 md:px-4 md:pt-6">
      <BackBar title="Хайх" href="/" />
      <h1 className="hidden text-[28px] font-bold leading-9 md:block">
        {genre ?? "Хайх"}
      </h1>

      <div className="flex flex-col gap-4 px-4 md:px-0">
        <Suspense>
          <SearchBox initial={q} />
        </Suspense>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {chip("Бүгд", null)}
          {genres.map((g) => chip(g, g))}
        </div>
      </div>

      <div className="px-4 md:px-0">
        {browsing ? (
          <div className="flex flex-col gap-6 md:gap-10">
            <TitleRow title="Шинэ" items={items.slice(0, 12)} />
            {items.length > 4 && (
              <TitleRow
                title="Санал болгох"
                items={[...items].reverse().slice(0, 12)}
              />
            )}
          </div>
        ) : items.length ? (
          <>
            <p className="mb-3 text-body-2 text-fg-muted">
              {items.length} бүтээл олдлоо
            </p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 md:gap-x-10 md:gap-y-8">
              {items.map((t) => (
                <TitleCard key={t.slug} t={t} fluid />
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-body font-semibold">Илэрц олдсонгүй</p>
            <p className="mt-1 text-body-2 text-fg-muted">
              Өөр үгээр эсвэл эх нэрээр нь хайгаад үзээрэй.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
