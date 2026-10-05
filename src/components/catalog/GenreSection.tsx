"use client";
import { useState } from "react";
import { HScroll, SectionHeader } from "./Section";
import { TitleCard, type TitleCardData } from "./TitleCard";

export type GenreItem = TitleCardData & { genres: string[] };

/** Desktop "Жанр" section: title + 554px tab strip (Figma "Genres"), row filtered by tab. */
export function GenreSection({ genres, items }: { genres: string[]; items: GenreItem[] }) {
  const [active, setActive] = useState(genres[0]);
  const shown = items.filter((t) => t.genres.includes(active));

  return (
    <section className="hidden flex-col gap-4 md:flex">
      <SectionHeader
        title="Жанр"
        right={
          <div role="tablist" className="no-scrollbar flex w-[554px] gap-4 overflow-x-auto border-b border-stroke py-2">
            {genres.map((g) => {
              const on = g === active;
              return (
                <button
                  key={g}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(g)}
                  className={`h-5 w-[79px] shrink-0 text-center text-body-2 font-medium tracking-[0.2px] ${
                    on ? "border-b-2 border-brand-500 text-brand-300" : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        }
      />
      <HScroll>
        {shown.length ? (
          shown.map((t) => <TitleCard key={t.slug} t={t} />)
        ) : (
          <p className="py-10 text-body-2 text-fg-muted">Энэ жанрт бүтээл алга.</p>
        )}
      </HScroll>
    </section>
  );
}
