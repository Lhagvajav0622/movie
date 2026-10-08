import { FeatureBanner } from "@/components/catalog/HeroBanner";
import { HeroSlider } from "@/components/catalog/HeroSlider";
import { GenreSection } from "@/components/catalog/GenreSection";
import { HeroCarousel, MobileTopBar, RecommendedGrid, StarredCard, Top10Row } from "@/components/catalog/MobileHome";
import { TitleRow } from "@/components/catalog/TitleRow";
import { getHomeData } from "@/server/home";
import { getSession } from "@/server/auth";
import { listHistory, listSaved } from "@/server/library";

export default async function HomePage() {
  // Everything the page needs is fetched at the same time (each query is a round trip to the database).
  const session = await getSession().catch(() => null);
  const uid = session?.user.id;
  const [{ items: everything, genres: allGenres }, history, saved] = await Promise.all([
    getHomeData(),
    uid ? listHistory(uid, 10).catch(() => []) : Promise.resolve([]),
    uid ? listSaved(uid).catch(() => []) : Promise.resolve([]),
  ]);
  // "+18" titles live only in their own row at the bottom, not in hero / featured / latest rows.
  const adultItems = everything.filter((t) => t.adult);
  const regular = everything.filter((t) => !t.adult);
  const all = regular.length ? regular : everything;
  const genres = allGenres.filter((g) => g !== "+18");
  const adultHref = `/search?genre=${encodeURIComponent("+18")}`;
  const savedSlugs = saved.map((x) => x.slug);
  const continueItems = history.map((h) => ({
    slug: h.slug,
    name: h.name,
    year: h.year,
    posterUrl: h.posterUrl,
    priceMnt: h.priceMnt,
    adult: h.adult,
  }));
  const featuredFirst = [...all].sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
  const latest = all; // already newest first
  const series = all.filter((t) => t.vertical);
  const films = all.filter((t) => !t.vertical);
  const spotlight = featuredFirst[1] ?? featuredFirst[0];

  return (
    <>
      {/* Mobile (Figma "Home Screen", 390 wide) */}
      <div className="flex flex-col gap-4 px-4 pt-3 md:hidden">
        <div className="-mx-4">
          <MobileTopBar />
        </div>
        <div className="-mx-4">
          <HeroCarousel items={featuredFirst.slice(0, 4)} />
        </div>
        {continueItems.length > 0 && <TitleRow title="Үргэлжлүүлэн үзэх" href="/history" items={continueItems} />}
        <Top10Row items={all} />
        {adultItems.length > 0 && <TitleRow title="+18" href={adultHref} items={adultItems} />}
        {series.length > 0 && <TitleRow title="Цуврал драм" href="/search" items={series} />}
        <StarredCard
          t={spotlight}
          meta={[spotlight.year ? String(spotlight.year) : null, spotlight.genres[0], spotlight.vertical ? "Цуврал" : "Кино"].filter(
            (x): x is string => Boolean(x),
          )}
        />
        {films.length > 0 && <TitleRow title="Уран сайхны кино" href="/search" items={films} />}
        <RecommendedGrid items={all.slice(0, 8)} />
      </div>

      {/* Desktop (Figma "Home", 1440 wide, 1088 content) */}
      <div className="mx-auto hidden max-w-[1120px] flex-col gap-10 px-4 pt-6 md:flex">
        <HeroSlider items={featuredFirst.slice(0, 5)} savedSlugs={savedSlugs} />
        {continueItems.length > 0 && <TitleRow title="Үргэлжлүүлэн үзэх" href="/history" items={continueItems} />}
        <TitleRow title="Онцлох бүтээлүүд" href="/search" items={featuredFirst.slice(0, 10)} />
        {adultItems.length > 0 && <TitleRow title="+18" href={adultHref} items={adultItems} />}
        <TitleRow title="Сүүлд гарсан" href="/search" items={latest} />
        <GenreSection genres={genres} items={all} />
        <FeatureBanner t={spotlight} saved={savedSlugs.includes(spotlight.slug)} />
        {series.length > 0 && <TitleRow title="Цуврал драм" href="/search" items={series} />}
        {films.length > 0 && <TitleRow title="Уран сайхны кино" href="/search" items={films} />}
      </div>
    </>
  );
}
