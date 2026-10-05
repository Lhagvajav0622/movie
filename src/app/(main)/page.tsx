import { HeroBanner } from "@/components/catalog/HeroBanner";
import { TitleRow } from "@/components/catalog/TitleRow";
import { demoGenres, demoTitles } from "@/lib/demo";

// Day-1 preview: demo data. Switched to database queries on day 5.
export default function HomePage() {
  const featured = demoTitles.slice(0, 6);
  const latest = [...demoTitles].reverse();
  const hero = demoTitles[0];

  return (
    <>
      <HeroBanner
        slug={hero.slug}
        name={hero.name}
        meta="2025 · 2ц 19м · 16+ · HD"
        description="Нэгэн залуу эмэгтэй хуучин хотын нууцлаг гэр бүлийн түүхтэй учирч, амьдрал нь эргэлт хийнэ."
        hue={hero.hue}
      />
      <TitleRow title="Онцлох бүтээлүүд" href="/search" items={featured} />
      <TitleRow title="Сүүлд гарсан" href="/search" items={latest} />
      <TitleRow
        title="Жанр"
        items={demoTitles}
        right={
          <div className="no-scrollbar hidden max-w-[50vw] gap-4 overflow-x-auto text-body-2 md:flex">
            {demoGenres.map((g, i) => (
              <span key={g} className={i === 0 ? "text-brand-300 underline underline-offset-8" : "text-fg-muted"}>
                {g}
              </span>
            ))}
          </div>
        }
      />
    </>
  );
}
