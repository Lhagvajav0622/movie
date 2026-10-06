import Link from "next/link";
import { IconLock } from "@/components/ui/icons";
import { Poster } from "./TitleCard";
import type { EpisodeView } from "@/server/title";

const minutes = (sec: number) => `${Math.max(1, Math.round(sec / 60))} мин`;

/** Figma "ContentList": 142×80 thumbnail (mobile) / 148×83 (desktop), bold episode name, duration. */
export function EpisodeList({ slug, episodes, hue }: { slug: string; episodes: EpisodeView[]; hue?: number }) {
  if (!episodes.length) {
    return <p className="text-body-2 text-fg-muted">Анги удахгүй нэмэгдэнэ.</p>;
  }
  return (
    <ul className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-x-8">
      {episodes.map((e) => (
        <li key={e.id}>
          <Link href={`/watch/${slug}/${e.number}`} className="group flex items-start gap-2 md:gap-4">
            <div className="relative h-20 w-[142px] shrink-0 overflow-hidden rounded-[4px] md:h-[83px] md:w-[148px]">
              {e.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.thumbnailUrl} alt="" className="size-full object-cover" />
              ) : (
                <Poster t={{ slug, name: "", priceMnt: 0, hue: (hue ?? 250) + e.number * 7 }} className="size-full" />
              )}
              {e.access === "locked" && (
                <span className="absolute inset-0 grid place-items-center bg-black/50 text-fg">
                  <IconLock size={20} />
                </span>
              )}
            </div>
            <div className="min-w-0 font-bold">
              <p className="truncate text-body tracking-[0.2px] group-hover:text-brand-300">{e.name || `${e.number}-р анги`}</p>
              <p className="text-caption leading-[22px] text-fg-muted">
                {minutes(e.durationSec)}
                {(e.access === "preview" || e.access === "clip") && " · үнэгүй хэсэгтэй"}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
