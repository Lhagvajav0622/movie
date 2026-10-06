"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Backdrop, HeroButtons, MetaInfo } from "./HeroBanner";
import type { TitleCardData } from "./TitleCard";

const INTERVAL_MS = 6000;

/**
 * Desktop home hero: slides cross-fade automatically, pause while hovered / focused,
 * with prev / next arrows and a pager whose active pill fills up as the timer runs.
 */
export function HeroSlider({ items, savedSlugs = [] }: { items: TitleCardData[]; savedSlugs?: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, count]);

  if (!count) return null;
  const go = (i: number) => setIndex((i + count) % count);

  return (
    <section
      className="relative hidden h-[458px] overflow-hidden rounded-lg shadow-hero md:block"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Онцлох бүтээлүүд"
    >
      {items.map((t, i) => (
        <div
          key={t.slug}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <Backdrop t={t} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 pb-14">
            <Link href={`/title/${t.slug}`} tabIndex={i === index ? 0 : -1}>
              <h1 className="text-h1 font-bold">{t.name}</h1>
            </Link>
            <MetaInfo t={t} />
            {t.description && (
              <p className="line-clamp-2 max-w-[720px] text-body font-medium tracking-[0.2px] text-fg-muted">
                {t.description}
              </p>
            )}
            <HeroButtons slug={t.slug} id={t.id} saved={savedSlugs.includes(t.slug)} />
          </div>
        </div>
      ))}

      {count > 1 && (
        <>
          <div className="absolute bottom-5 right-6 flex items-center gap-3">
            <button
              type="button"
              aria-label="Өмнөх"
              onClick={() => go(index - 1)}
              className="glass grid size-9 place-items-center rounded-full"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5">
              {items.map((t, i) =>
                i === index ? (
                  <span
                    key={t.slug}
                    className="relative h-1.5 w-16 overflow-hidden rounded-full bg-white/25"
                    aria-current="true"
                  >
                    <span
                      key={`${index}-${paused}`}
                      className="absolute inset-y-0 left-0 rounded-full bg-brand-300"
                      style={{
                        width: paused ? "100%" : undefined,
                        animation: paused
                          ? undefined
                          : `hero-progress ${INTERVAL_MS}ms linear forwards`,
                      }}
                    />
                  </span>
                ) : (
                  <button
                    key={t.slug}
                    type="button"
                    aria-label={`${i + 1}`}
                    onClick={() => go(i)}
                    className="size-1.5 rounded-full bg-white/40 transition hover:bg-white/70"
                  />
                ),
              )}
            </div>
            <button
              type="button"
              aria-label="Дараагийн"
              onClick={() => go(index + 1)}
              className="glass grid size-9 place-items-center rounded-full"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </>
      )}
    </section>
  );
}
