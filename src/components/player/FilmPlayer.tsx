"use client";
import Link from "next/link";
import { useEffect } from "react";
import { usePlayback } from "./usePlayback";
import { PlayerOverlay } from "./PlayerOverlay";
import { SkipButtons } from "./SkipButtons";
import { BackArrow } from "@/components/catalog/DetailChrome";
import { EpisodeList } from "@/components/catalog/EpisodeList";
import type { EpisodeView } from "@/server/title";

/** Horizontal (16:9) player for films and horizontal series. Native controls give fullscreen on every device. */
export function FilmPlayer({
  slug,
  titleName,
  episodes,
  current,
  titleId,
  priceMnt,
  hue,
}: {
  slug: string;
  titleName: string;
  episodes: EpisodeView[];
  current: EpisodeView;
  titleId: string;
  priceMnt: number;
  hue?: number;
}) {
  const { videoRef, state, previewEnded } = usePlayback(current.id, true);
  const idx = episodes.findIndex((e) => e.id === current.id);
  const next = episodes[idx + 1];

  useEffect(() => {
    const v = videoRef.current;
    if (v && state.status === "ready") v.play().catch(() => {});
  }, [state, videoRef]);

  return (
    <div className="mx-auto max-w-[1120px] md:px-4 md:pt-6">
      <div className="flex h-14 items-center md:hidden">
        <BackArrow fallback={`/title/${slug}`} />
        <p className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-body font-bold">{titleName}</p>
      </div>

      <div className="relative aspect-video w-full overflow-hidden bg-black md:rounded-lg">
        <video
          ref={videoRef}
          controls
          playsInline
          preload="auto"
          poster={current.thumbnailUrl ?? undefined}
          className="size-full"
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
        {state.status === "ready" && <SkipButtons videoRef={videoRef} />}
        <PlayerOverlay titleId={titleId} state={state} previewEnded={previewEnded} priceMnt={priceMnt} />
      </div>

      <div className="flex flex-col gap-6 px-4 pt-4 md:px-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={`/title/${slug}`} className="text-[20px] font-bold leading-7 hover:text-brand-300 md:text-h4">
              {titleName}
            </Link>
            {episodes.length > 1 && <p className="text-body-2 text-fg-muted">{current.number}-р анги</p>}
          </div>
          {next && (
            <Link
              href={`/watch/${slug}/${next.number}`}
              className="shrink-0 rounded-lg border-[1.5px] border-brand-300 bg-brand-500 px-4 py-2 text-body-2 font-semibold"
            >
              Дараагийн анги →
            </Link>
          )}
        </div>
        {episodes.length > 1 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-[15px] font-semibold md:text-[28px] md:font-bold md:leading-9">Ангиуд</h2>
            <EpisodeList slug={slug} episodes={episodes} hue={hue} />
          </section>
        )}
      </div>
    </div>
  );
}
