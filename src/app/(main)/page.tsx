import { FeatureBanner, HeroBanner } from "@/components/catalog/HeroBanner";
import { GenreSection } from "@/components/catalog/GenreSection";
import { HeroCarousel, MobileTopBar, RecommendedGrid, StarredCard, Top10Row } from "@/components/catalog/MobileHome";
import { TitleRow } from "@/components/catalog/TitleRow";
import { demoGenres, demoTitles } from "@/lib/demo";

// Preview data until the database has titles (wired on day 5).
export default function HomePage() {
  const all = demoTitles;
  const featured = all.slice(0, 8);
  const latest = [...all].reverse();
  const series = all.filter((t) => t.vertical);
  const films = all.filter((t) => !t.vertical);

  return (
    <>
      {/* Mobile (Figma "Home Screen", 390 wide) */}
      <div className="flex flex-col gap-4 px-4 pt-3 md:hidden">
        <div className="-mx-4">
          <MobileTopBar />
        </div>
        <div className="-mx-4">
          <HeroCarousel items={all.slice(0, 4)} />
        </div>
        <Top10Row items={all} />
        <TitleRow title="Цуврал драм" href="/search" items={series} />
        <StarredCard t={all[4]} meta={["2025", "Романс", "40 анги"]} />
        <TitleRow title="Уран сайхны кино" href="/search" items={films} />
        <RecommendedGrid items={all.slice(0, 8)} />
      </div>

      {/* Desktop (Figma "Home", 1440 wide, 1088 content) */}
      <div className="mx-auto hidden max-w-[1120px] flex-col gap-10 px-4 pt-6 md:flex">
        <HeroBanner t={all[0]} />
        <TitleRow title="Онцлох бүтээлүүд" href="/search" items={featured} />
        <TitleRow title="Сүүлд гарсан" href="/search" items={latest} />
        <GenreSection genres={demoGenres} items={all} />
        <FeatureBanner t={all[2]} />
        <TitleRow title="Цуврал драм" href="/search" items={series} />
        <TitleRow title="Уран сайхны кино" href="/search" items={films} />
      </div>
    </>
  );
}
