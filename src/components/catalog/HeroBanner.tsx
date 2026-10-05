import Link from "next/link";

export function HeroBanner({
  slug,
  name,
  meta,
  description,
  backdropUrl,
  hue = 250,
}: {
  slug: string;
  name: string;
  meta: string;
  description?: string;
  backdropUrl?: string | null;
  hue?: number;
}) {
  return (
    <section className="px-4 pt-2 md:px-10">
      <div
        className="relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl shadow-glow sm:aspect-[16/9] md:aspect-[21/9]"
        style={{
          background: backdropUrl
            ? `url(${backdropUrl}) center/cover`
            : `linear-gradient(135deg, hsl(${hue} 40% 30%), hsl(${(hue + 60) % 360} 35% 10%))`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative max-w-xl p-5 md:p-10">
          <h1 className="text-h4 font-bold md:text-h1">{name}</h1>
          <p className="mt-2 text-body-2 text-fg-muted">{meta}</p>
          {description && (
            <p className="mt-3 line-clamp-3 hidden text-body-2 text-fg-muted md:block">{description}</p>
          )}
          <div className="mt-5 flex gap-3">
            <Link
              href={`/title/${slug}`}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-8 font-semibold hover:bg-brand-400"
            >
              Тоглуулах ▷
            </Link>
            <button
              aria-label="Хадгалах"
              className="grid size-11 place-items-center rounded-lg bg-brand-500/90 text-xl hover:bg-brand-400"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
