import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/server/auth";
import { getTitleDetail, getTitleMeta, type TitleDetail } from "@/server/title";
import { formatDuration } from "@/components/catalog/HeroBanner";
import { BackBar, DetailTabs } from "@/components/catalog/DetailChrome";
import { EpisodeList } from "@/components/catalog/EpisodeList";
import { SaveButton } from "@/components/catalog/SaveButton";
import { TitleRow } from "@/components/catalog/TitleRow";
import { Poster } from "@/components/catalog/TitleCard";
import { BuyButton } from "@/components/payment/BuyButton";
import { IconPlay } from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: PageProps<"/title/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTitleMeta(slug).catch(() => null);
  if (!t) return { title: "Олдсонгүй" };
  return {
    title: t.name,
    description: t.description ?? undefined,
    openGraph: {
      title: t.name,
      description: t.description ?? undefined,
      images: t.image ?? undefined,
    },
  };
}

function metaParts(t: TitleDetail) {
  return [
    t.year,
    t.type === "series"
      ? `${t.episodes.length} анги`
      : formatDuration(t.totalDurationSec),
    t.ageRating,
    "HD",
  ].filter(Boolean) as (string | number)[];
}

function Backdrop({
  t,
  className = "",
}: {
  t: TitleDetail;
  className?: string;
}) {
  if (t.backdropUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img src={t.backdropUrl} alt="" className={`object-cover ${className}`} />
    );
  }
  return (
    <Poster
      t={{
        slug: t.slug,
        name: "",
        priceMnt: 0,
        hue: t.hue,
        posterUrl: t.posterUrl,
      }}
      className={className}
    />
  );
}

function Info({ t }: { t: TitleDetail }) {
  const rows: [string, string | null][] = [
    ["Найруулагч", t.director],
    ["Жүжигчид", t.castText],
    ["Улс", t.country],
    ["Эх нэр", t.nameOriginal],
  ];
  return (
    <div className="flex flex-col gap-3">
      {t.description && (
        <p className="text-body-2 leading-6 text-fg-muted">{t.description}</p>
      )}
      <dl className="flex flex-col gap-1 text-body-2">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex gap-1">
              <dt className="text-fg-muted">{k}:</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

function GenreChips({ genres }: { genres: string[] }) {
  if (!genres.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((g) => (
        <Link
          key={g}
          href={`/search?genre=${encodeURIComponent(g)}`}
          className="rounded-lg border-[1.5px] border-stroke bg-black px-2 py-1 text-caption font-medium leading-[22px]"
        >
          {g}
        </Link>
      ))}
    </div>
  );
}

export default async function TitlePage({
  params,
}: PageProps<"/title/[slug]">) {
  const { slug } = await params;
  const session = await getSession().catch(() => null);
  const t = await getTitleDetail(slug, session?.user.id);
  if (!t) notFound();

  const firstEp = t.episodes[0]?.number ?? 1;
  const needsPurchase = t.priceMnt > 0 && !t.owned;
  const similar = t.similar.map((s) => ({ ...s, hue: s.hue }));
  const playLabel = t.owned || t.priceMnt === 0 ? "Тоглуулах" : "Үнэгүй үзэх";

  return (
    <>
      {/* Mobile (Figma "Movie info screen") */}
      <div className="md:hidden">
        <BackBar title={t.name} />
        <div className="aspect-[390/219] w-full overflow-hidden">
          <Backdrop t={t} className="size-full" />
        </div>
        <div className="flex flex-col gap-4 px-4 pt-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] font-bold leading-7">{t.name}</h1>
            <div className="flex items-center gap-2 text-caption font-medium leading-[22px]">
              {metaParts(t).map((p) => (
                <span key={String(p)}>{p}</span>
              ))}
            </div>
            <GenreChips genres={t.genres} />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/watch/${t.slug}/${firstEp}`}
              className="flex-1 rounded-lg border-[1.5px] border-brand-300 bg-brand-500 px-6 py-3 text-center text-[13px] font-medium leading-4 tracking-[0.5px]"
            >
              {playLabel}
            </Link>
            <SaveButton
              titleId={t.id}
              slug={t.slug}
              initial={t.saved}
              variant="tab"
              disabled={t.isDemo}
            />
          </div>
          {needsPurchase && (
            <BuyButton
              titleId={t.id}
              priceMnt={t.priceMnt}
              className="h-11 w-full text-[13px]"
            />
          )}
          {t.type === "series" ? (
            <DetailTabs
              tabs={[
                {
                  label: "Ангиуд",
                  content: (
                    <EpisodeList
                      slug={t.slug}
                      episodes={t.episodes}
                      hue={t.hue}
                    />
                  ),
                },
                { label: "Дэлгэрэнгүй", content: <Info t={t} /> },
              ]}
            />
          ) : (
            <Info t={t} />
          )}
          {similar.length > 0 && (
            <TitleRow title="Ижил төстэй кино" items={similar} />
          )}
        </div>
      </div>

      {/* Desktop (Figma "Movie", 1440) */}
      <div className="mx-auto hidden max-w-[1120px] flex-col gap-10 px-4 pt-6 md:flex">
        <section className="relative flex h-[458px] flex-col justify-end overflow-hidden rounded-lg p-6 shadow-hero">
          <div className="absolute inset-0">
            <Backdrop t={t} className="size-full" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="relative flex max-w-[710px] flex-col gap-4 [text-shadow:0_1px_12px_rgba(0,0,0,0.8)]">
            <h1 className="text-h1 font-bold">{t.name}</h1>
            <div className="flex items-center gap-2 text-body font-medium tracking-[0.2px]">
              {metaParts(t).map((p) => (
                <span key={String(p)}>{p}</span>
              ))}
            </div>
            <GenreChips genres={t.genres} />
            {t.description && (
              <p className="line-clamp-3 text-body font-medium tracking-[0.2px] text-fg-muted">
                {t.description}
              </p>
            )}
            <div className="flex items-center gap-4">
              <Link
                href={`/watch/${t.slug}/${firstEp}`}
                className="flex w-[264px] items-center justify-center gap-3 rounded-lg border-[1.5px] border-brand-300 bg-brand-500 px-8 py-4 text-[17px] font-semibold leading-6 tracking-[1px] hover:bg-brand-400"
              >
                {playLabel}
                <IconPlay />
              </Link>
              <SaveButton
                titleId={t.id}
                slug={t.slug}
                initial={t.saved}
                variant="icon"
                disabled={t.isDemo}
              />
              {needsPurchase && (
                <BuyButton
                  titleId={t.id}
                  priceMnt={t.priceMnt}
                  className="h-[59px] px-6 text-[15px]"
                />
              )}
            </div>
          </div>
        </section>

        {t.type === "series" && (
          <section className="flex flex-col gap-4">
            <h2 className="text-[28px] font-bold leading-9">Ангиуд</h2>
            <EpisodeList slug={t.slug} episodes={t.episodes} hue={t.hue} />
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-[28px] font-bold leading-9">Мэдээлэл</h2>
          <Info t={{ ...t, description: null }} />
        </section>

        {similar.length > 0 && (
          <TitleRow title="Ижил төстэй бүтээлүүд" items={similar} />
        )}
      </div>
    </>
  );
}
