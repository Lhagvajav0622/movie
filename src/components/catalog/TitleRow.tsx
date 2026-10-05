import Link from "next/link";
import { TitleCard, type TitleCardData } from "./TitleCard";

export function TitleRow({
  title,
  href,
  items,
  right,
}: {
  title: string;
  href?: string;
  items: TitleCardData[];
  right?: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-4 px-4 md:px-10">
        <h2 className="text-lg font-bold md:text-xl">{title}</h2>
        <div className="ml-auto flex items-center gap-4">
          {right}
          {href && (
            <Link href={href} aria-label="Бүгдийг харах" className="text-fg-muted hover:text-fg">
              ›
            </Link>
          )}
        </div>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 md:gap-4 md:px-10">
        {items.map((t) => (
          <TitleCard key={t.slug} t={t} />
        ))}
      </div>
    </section>
  );
}
