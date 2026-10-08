import Link from "next/link";
import { Poster } from "./TitleCard";

/** Figma "Saved / Watch history" row: 2:3 poster, bold two-line title, "year • type" meta, optional progress. */
export function MediaListItem({
  href,
  t,
  meta,
  progress,
  action,
}: {
  href: string;
  t: { slug: string; name: string; posterUrl: string | null; priceMnt: number };
  meta: string;
  progress?: number;
  /** Optional control shown at the right edge of the row (e.g. a remove button). */
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      <Link
        href={href}
        className="group flex min-w-0 flex-1 items-center gap-2"
      >
        <div className="relative h-[112px] w-[76px] shrink-0 overflow-hidden rounded-[4px]">
          <Poster t={{ ...t, name: "" }} className="size-full" />
          {progress != null && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
              <div
                className="h-full bg-brand-400"
                style={{
                  width: `${Math.min(100, Math.max(2, progress * 100))}%`,
                }}
              />
            </div>
          )}
        </div>
        <div className="min-w-0 px-1">
          <p className="line-clamp-2 text-body font-bold tracking-[0.2px] group-hover:text-brand-300">
            {t.name}
          </p>
          <p className="mt-1 text-caption leading-[22px] text-fg-subtle">
            {meta}
          </p>
        </div>
      </Link>
      {action}
    </li>
  );
}

export const typeLabel = (type: "film" | "series") =>
  type === "series" ? "Цуврал" : "Кино";
