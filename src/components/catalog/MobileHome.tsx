"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconBell, IconPlayLarge, IconSearch } from "@/components/ui/icons";
import { HScroll, SectionHeader } from "./Section";
import { Poster, TitleCard, type TitleCardData } from "./TitleCard";

/** Mobile top bar: search field (links to /search) + bell. */
export function MobileTopBar() {
  return (
    <div className="flex items-center pl-4 md:hidden">
      <Link
        href="/search"
        className="flex flex-1 items-center gap-1 rounded-lg border border-stroke bg-black px-4 py-3 text-body tracking-[0.2px] text-fg-muted"
      >
        <IconSearch />
        Хайх
      </Link>
      <span className="p-4 text-fg" aria-hidden>
        <IconBell />
      </span>
    </div>
  );
}

/** Mobile "New" carousel: full-bleed 318px slides, frosted play button, pill pager. */
export function HeroCarousel({ items }: { items: TitleCardData[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const touching = useRef(false);

  // Auto-advance every 5s; stops while a finger is on the carousel.
  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      const el = ref.current;
      if (!el || touching.current) return;
      const next = (index + 1) % items.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => clearTimeout(t);
  }, [index, items.length]);

  return (
    <section className="flex flex-col items-center gap-4 md:hidden">
      <div className="relative w-full">
        <div
          ref={ref}
          onTouchStart={() => (touching.current = true)}
          onTouchEnd={() => (touching.current = false)}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {items.map((t) => (
            <Link key={t.slug} href={`/title/${t.slug}`} className="relative h-[318px] w-full shrink-0 snap-center">
              {t.backdropUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.backdropUrl} alt={t.name} className="size-full object-cover" />
              ) : (
                <Poster t={{ ...t, name: "" }} className="size-full" />
              )}
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_76px_65.6px_0_#000]" />
              <span className="absolute bottom-6 left-4 right-24 line-clamp-2 text-[22px] font-bold leading-7">{t.name}</span>
            </Link>
          ))}
        </div>
        <Link
          href={items[index] ? `/title/${items[index].slug}` : "/"}
          aria-label="Тоглуулах"
          className="glass absolute bottom-6 right-6 grid size-14 place-items-center rounded-2xl"
        >
          <IconPlayLarge />
        </Link>
      </div>
      <div className="flex items-center gap-[5px]">
        {items.map((t, i) =>
          i === index ? (
            <span key={t.slug} className="relative h-1.5 w-20 rounded-[20px] bg-brand-50">
              <span className="absolute left-0 top-0 size-1.5 rounded-[7px] bg-brand-500" />
            </span>
          ) : (
            <button
              key={t.slug}
              aria-label={`${i + 1}`}
              onClick={() => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: "smooth" })}
              className="size-1.5 rounded-md bg-brand-200"
            />
          ),
        )}
      </div>
    </section>
  );
}

/** Mobile "Top 10 кино": 148×216 posters with the big outlined rank number. */
export function Top10Row({ items }: { items: TitleCardData[] }) {
  return (
    <section className="flex flex-col gap-2 md:hidden">
      <SectionHeader title="Top 10 кино" href="/search" />
      <HScroll>
        {items.slice(0, 10).map((t, i) => (
          <Link key={t.slug} href={`/title/${t.slug}`} className="relative h-[216px] w-[148px] shrink-0 overflow-hidden rounded-[4px]" aria-label={t.name}>
            <Poster t={{ ...t, name: "" }} className="size-full" />
            <span
              className="absolute top-[184px] -translate-x-1/2 -translate-y-1/2 font-display text-[64px] font-bold leading-[48px] text-black/40 [-webkit-text-stroke:2px_var(--color-brand-500)]"
              style={{ left: i === 9 ? 38 : i >= 7 ? 26 : i >= 4 ? 24 : i === 0 ? 20 : 25 }}
            >
              {i + 1}
            </span>
          </Link>
        ))}
      </HScroll>
    </section>
  );
}

/** Mobile "Starred movie" card (358×256). */
export function StarredCard({ t, meta }: { t: TitleCardData; meta: string[] }) {
  return (
    <section className="relative flex h-64 items-end overflow-hidden rounded-lg border border-stroke p-4 md:hidden">
      <div className="absolute inset-0">
        {t.backdropUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.backdropUrl} alt="" className="size-full object-cover" />
        ) : (
          <Poster t={{ ...t, name: "" }} className="size-full" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(235.2deg,rgba(0,0,0,0)_0.47%,rgba(0,0,0,0.6)_99.53%)]" />
      </div>
      <div className="relative flex flex-1 flex-col items-center gap-2">
        <p className="text-body font-bold">{t.name}</p>
        <div className="flex items-center gap-2 text-[14px] leading-4">
          {meta.map((m, i) => (
            <span key={m} className="flex items-center gap-2">
              {i > 0 && <span className="size-1 rounded-lg bg-white" />}
              {m}
            </span>
          ))}
        </div>
        <div className="flex w-full items-center gap-2">
          <Link
            href={`/title/${t.slug}`}
            className="flex-1 rounded-lg border-[1.5px] border-brand-300 bg-brand-500 px-6 py-3 text-center text-[13px] font-medium leading-4 tracking-[0.5px]"
          >
            Тоглуулах
          </Link>
          <button
            type="button"
            className="rounded-lg border-[1.5px] border-brand-100 bg-brand-50 px-6 py-3 text-[13px] font-medium leading-4 tracking-[0.5px] text-brand-500"
          >
            Хадгалах
          </button>
        </div>
      </div>
    </section>
  );
}

/** Mobile "Санал болгосон": two-column grid of fluid cards. */
export function RecommendedGrid({ items }: { items: TitleCardData[] }) {
  return (
    <section className="flex flex-col gap-2 md:hidden">
      <SectionHeader title="Санал болгосон" />
      <div className="grid grid-cols-2 gap-4">
        {items.map((t) => (
          <TitleCard key={t.slug} t={t} fluid />
        ))}
      </div>
    </section>
  );
}
