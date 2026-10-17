import Link from "next/link";

/** "Бүх багц" + one button per category (names and order come from Admin → Ангилал). */
export function CategoryChips({ categories, className = "" }: { categories: string[]; className?: string }) {
  const cls =
    "shrink-0 rounded-lg border-[1.5px] border-stroke bg-surface px-4 py-2 text-[14px] font-medium leading-6 hover:border-brand-300";
  return (
    <nav aria-label="Ангилал" className={`no-scrollbar flex gap-2 overflow-x-auto ${className}`}>
      <Link href="/search" className={`${cls} border-brand-300 bg-brand-500 text-on-brand hover:bg-brand-400`}>
        Бүх багц
      </Link>
      {categories.map((c) => (
        <Link key={c} href={`/search?genre=${encodeURIComponent(c)}`} className={cls}>
          {c}
        </Link>
      ))}
    </nav>
  );
}
