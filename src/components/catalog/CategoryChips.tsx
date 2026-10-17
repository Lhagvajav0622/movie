import Link from "next/link";

/** "Бүх багц" + one button per category (names and order come from Admin → Ангилал). */
export function CategoryChips({ categories, className = "" }: { categories: string[]; className?: string }) {
  const base = "shrink-0 rounded-lg border-[1.5px] px-4 py-2 text-[14px] font-medium leading-6";
  const cls = `${base} border-stroke bg-surface text-fg hover:border-brand-300`;
  return (
    <nav aria-label="Ангилал" className={`no-scrollbar flex gap-2 overflow-x-auto ${className}`}>
      <Link href="/search" className={`${base} border-brand-300 bg-brand-500 text-on-brand hover:bg-brand-400`}>
        Бүх багц
      </Link>
      {categories.map((c) => (
        <Link key={c} href={`/search?genre=${encodeURIComponent(c)}`} className={cls}>
          {c}
        </Link>
      ))}
      <Link href="/packages" className={`${base} border-brand-300 text-brand-300 hover:bg-brand-500/10`}>
        Багц авах
      </Link>
    </nav>
  );
}

/** Prominent "buy a package" strip, shown only when at least one package is on sale. */
export function PackageBanner({ fromMnt, className = "" }: { fromMnt: number; className?: string }) {
  return (
    <Link
      href="/packages"
      className={`flex items-center justify-between gap-3 rounded-2xl border border-brand-300/60 bg-brand-500/10 px-4 py-3 ${className}`}
    >
      <span className="text-body-2">
        <b className="text-brand-300">Багц авах</b> · ангилал бүрийн бүх киног хугацаанд нь үзээрэй
      </span>
      <span className="shrink-0 text-body-2 font-semibold text-brand-300">{fromMnt.toLocaleString("mn-MN")}₮-өөс →</span>
    </Link>
  );
}
