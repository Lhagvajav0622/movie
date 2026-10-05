import { HScroll, SectionHeader } from "./Section";
import { TitleCard, type TitleCardData } from "./TitleCard";

export function TitleRow({ title, href, items }: { title: string; href?: string; items: TitleCardData[] }) {
  return (
    <section className="flex flex-col gap-2 md:gap-4">
      <SectionHeader title={title} href={href} />
      <HScroll>
        {items.map((t) => (
          <TitleCard key={t.slug} t={t} />
        ))}
      </HScroll>
    </section>
  );
}
