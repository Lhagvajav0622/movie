import Link from "next/link";
import { IconPlay } from "@/components/ui/icons";
import { SaveButton } from "./SaveButton";
import type { TitleCardData } from "./TitleCard";

export function formatDuration(sec?: number | null) {
  if (!sec) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h}ц ${m}м` : `${m}м`;
}

export function MetaInfo({ t }: { t: TitleCardData }) {
  const parts = [t.year, formatDuration(t.durationSec), t.ageRating, "HD"].filter(Boolean);
  return (
    <div className="flex items-center gap-2 text-body font-medium tracking-[0.2px]">
      {parts.map((p) => (
        <span key={String(p)}>{p}</span>
      ))}
    </div>
  );
}

/** Play (264 wide) + add buttons from the Figma "Buttons" group. */
export function HeroButtons({ slug, id, saved = false }: { slug: string; id?: string; saved?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <Link
        href={`/title/${slug}`}
        className="flex w-[264px] items-center justify-center gap-3 rounded-lg border-[1.5px] border-brand-300 bg-brand-500 px-8 py-4 text-[17px] font-semibold leading-6 tracking-[1px] transition hover:bg-brand-400"
      >
        Тоглуулах
        <IconPlay />
      </Link>
      <SaveButton titleId={id ?? ""} slug={slug} initial={saved} variant="icon" disabled={!id} />
    </div>
  );
}

export function Backdrop({ t, dim = false }: { t: TitleCardData; dim?: boolean }) {
  const h = t.hue ?? 250;
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background: t.backdropUrl
          ? `url(${t.backdropUrl}) center/cover`
          : `linear-gradient(120deg, hsl(${h} 35% 28%), hsl(${(h + 50) % 360} 30% 10%))`,
        opacity: dim ? 0.2 : 1,
      }}
    />
  );
}

/** Desktop "SuggestedMovie": 458px tall, radius 8, brand glow. */
export function HeroBanner({ t }: { t: TitleCardData }) {
  return (
    <section className="relative hidden h-[458px] flex-col justify-end overflow-hidden rounded-lg p-6 shadow-hero md:flex">
      <Backdrop t={t} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="relative flex flex-col gap-4">
        <h1 className="text-h1 font-bold">{t.name}</h1>
        <MetaInfo t={t} />
        <HeroButtons slug={t.slug} id={t.id} />
      </div>
    </section>
  );
}

/** Desktop "Movie" feature block (488px, dimmed backdrop, description). */
export function FeatureBanner({ t, saved = false }: { t: TitleCardData; saved?: boolean }) {
  return (
    <section className="relative hidden h-[488px] overflow-hidden md:block">
      <Backdrop t={t} dim />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_53.67%,rgba(0,0,0,0.69)_77.31%,#000_87.78%)]" />
      <div className="absolute left-6 top-[194px] flex w-[710px] flex-col gap-4">
        <h2 className="text-h1 font-bold">{t.name}</h2>
        <MetaInfo t={t} />
        {t.description && (
          <p className="line-clamp-3 text-body font-medium tracking-[0.2px] text-fg-muted">{t.description}</p>
        )}
        <HeroButtons slug={t.slug} id={t.id} saved={saved} />
      </div>
    </section>
  );
}
