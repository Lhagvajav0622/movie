import Link from "next/link";

export type TitleCardData = {
  /** DB id (absent for demo items); needed to save a title */
  id?: string;
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
  /** "+18" title: poster is blurred until the viewer confirms their age */
  adult?: boolean;
};

/** Poster image, or a tinted placeholder until real posters are uploaded. */
export function Poster({
  t,
  className = "",
}: {
  t: TitleCardData;
  className?: string;
}) {
  const adult = t.adult ? { "data-adult": "" } : {};
  const label = t.adult ? (
    <span
      data-adult-label
      aria-hidden
      className="pointer-events-none absolute inset-0 items-center justify-center"
    >
      <span className="rounded-full border-2 border-white px-2 py-0.5 text-[15px] font-extrabold text-white">
        +18
      </span>
    </span>
  ) : null;
  if (t.posterUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.posterUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={`object-cover ${className}`}
          {...adult}
        />
        {label}
      </>
    );
  }
  const h = t.hue ?? 250;
  return (
    <>
      <div
        {...adult}
        className={`relative flex items-end p-2 ${className}`}
        style={{
          background: `linear-gradient(160deg, hsl(${h} 45% 32%), hsl(${(h + 40) % 360} 40% 12%))`,
        }}
      >
        <span className="line-clamp-3 text-[13px] font-bold leading-4">
          {t.name}
        </span>
      </div>
      {label}
    </>
  );
}

/**
 * "Movies" card. Mobile: 104×152 poster, 14/12 text. Desktop ("Movies Web"): 197×288, 16/14 text.
 * `fluid` = mobile "Movies 2x" grid card (full column width, 104/152 aspect).
 */
export function TitleCard({
  t,
  fluid = false,
}: {
  t: TitleCardData;
  fluid?: boolean;
}) {
  return (
    <Link
      href={`/title/${t.slug}`}
      className={`group flex flex-col gap-2 ${fluid ? "w-full" : "w-[104px] shrink-0 md:w-[197px]"}`}
    >
      <div
        className={`relative overflow-hidden rounded-[4px] ${
          fluid
            ? "aspect-[104/152] w-full"
            : "h-[152px] w-[104px] md:h-[288px] md:w-[197px]"
        }`}
      >
        <Poster
          t={t}
          className="size-full rounded-[4px] transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="min-w-0 font-medium">
        <p className="truncate text-[14px] leading-5 tracking-[0.2px] md:text-body md:leading-6">
          {t.name}
        </p>
        {t.year && (
          <p className="text-caption leading-[22px] text-fg-muted md:text-body-2 md:leading-5">
            {t.year}
          </p>
        )}
      </div>
    </Link>
  );
}
