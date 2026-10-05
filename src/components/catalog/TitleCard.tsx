import Link from "next/link";

export type TitleCardData = {
  slug: string;
  name: string;
  year?: number | null;
  posterUrl?: string | null;
  hue?: number;
  priceMnt: number;
};

export function TitleCard({ t }: { t: TitleCardData }) {
  return (
    <Link href={`/title/${t.slug}`} className="group block w-[132px] shrink-0 md:w-[180px]">
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-2"
        style={
          t.posterUrl
            ? undefined
            : {
                background: `linear-gradient(160deg, hsl(${t.hue ?? 250} 45% 32%), hsl(${
                  ((t.hue ?? 250) + 40) % 360
                } 40% 12%))`,
              }
        }
      >
        {t.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.posterUrl} alt="" className="size-full object-cover transition group-hover:scale-105" />
        ) : (
          <span className="absolute inset-x-2 bottom-3 line-clamp-3 text-body-2 font-bold">{t.name}</span>
        )}
        {t.priceMnt > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-brand-300">
            {t.priceMnt.toLocaleString("mn-MN")}₮
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-body-2 font-medium">{t.name}</p>
      {t.year && <p className="text-caption text-fg-subtle">{t.year}</p>}
    </Link>
  );
}
