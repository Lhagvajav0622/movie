import Link from "next/link";

export type TitleCardData = {
  slug: string;
  name: string;
  year?: number | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  hue?: number;
  priceMnt: number;
  description?: string | null;
  durationSec?: number | null;
  ageRating?: string | null;
};

/** Poster image, or a tinted placeholder until real posters are uploaded. */
export function Poster({ t, className = "" }: { t: TitleCardData; className?: string }) {
  if (t.posterUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={t.posterUrl} alt="" className={`object-cover ${className}`} />;
  }
  const h = t.hue ?? 250;
  return (
    <div
      className={`relative flex items-end p-2 ${className}`}
      style={{ background: `linear-gradient(160deg, hsl(${h} 45% 32%), hsl(${(h + 40) % 360} 40% 12%))` }}
    >
      <span className="line-clamp-3 text-[13px] font-bold leading-4">{t.name}</span>
    </div>
  );
}

/**
 * "Movies" card. Mobile: 104×152 poster, 14/12 text. Desktop ("Movies Web"): 197×288, 16/14 text.
 * `fluid` = mobile "Movies 2x" grid card (full column width, 104/152 aspect).
 */
export function TitleCard({ t, fluid = false }: { t: TitleCardData; fluid?: boolean }) {
  return (
    <Link
      href={`/title/${t.slug}`}
      className={`group flex flex-col gap-2 ${fluid ? "w-full" : "w-[104px] shrink-0 md:w-[197px]"}`}
    >
      <div
        className={`relative overflow-hidden rounded-[4px] ${
          fluid ? "aspect-[104/152] w-full" : "h-[152px] w-[104px] md:h-[288px] md:w-[197px]"
        }`}
      >
        <Poster t={t} className="size-full rounded-[4px] transition duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="min-w-0 font-medium">
        <p className="truncate text-[14px] leading-5 tracking-[0.2px] md:text-body md:leading-6">{t.name}</p>
        {t.year && <p className="text-caption leading-[22px] text-fg-muted md:text-body-2 md:leading-5">{t.year}</p>}
      </div>
    </Link>
  );
}
