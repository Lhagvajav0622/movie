"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePlayback } from "./usePlayback";
import { PlayerOverlay } from "./PlayerOverlay";
import { SkipButtons } from "./SkipButtons";
import { EpisodeList } from "@/components/catalog/EpisodeList";
import { IconPlay } from "@/components/ui/icons";
import type { EpisodeView } from "@/server/title";

type Ctx = {
  episodes: EpisodeView[];
  current: EpisodeView;
  playing: boolean;
  play: (episodeId?: string) => void;
  stageRef: React.RefObject<HTMLDivElement | null>;
};
const WatchCtx = createContext<Ctx | null>(null);
const useWatch = () => {
  const c = useContext(WatchCtx);
  if (!c) throw new Error("InlineWatch missing");
  return c;
};

/** Film / horizontal-series title page: the player lives at the top of the page itself (no separate watch screen). */
export function InlineWatch({
  episodes,
  children,
}: {
  episodes: EpisodeView[];
  children: React.ReactNode;
}) {
  const [epId, setEpId] = useState(episodes[0]?.id);
  const [playing, setPlaying] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const current = episodes.find((e) => e.id === epId) ?? episodes[0];
  const play = useCallback((id?: string) => {
    if (id) setEpId(id);
    setPlaying(true);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);
  const value = useMemo(
    () => ({ episodes, current, playing, play, stageRef }),
    [episodes, current, playing, play],
  );
  return <WatchCtx.Provider value={value}>{children}</WatchCtx.Provider>;
}

/** Button that starts playback right here. */
export function PlayButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { play, current } = useWatch();
  return (
    <button
      type="button"
      onClick={() => current && play()}
      disabled={!current}
      className={className}
    >
      {children}
    </button>
  );
}

export function FilmStage({
  titleId,
  priceMnt,
  backdrop,
  overlay,
}: {
  titleId: string;
  priceMnt: number;
  backdrop: React.ReactNode;
  /** Desktop hero text and buttons, shown over the cover until playback starts. */
  overlay: React.ReactNode;
}) {
  const { current, playing, play, episodes, stageRef } = useWatch();
  const { videoRef, state, previewEnded } = usePlayback(
    current?.id ?? null,
    playing,
  );
  const idx = episodes.findIndex((e) => e.id === current?.id);
  const next = episodes[idx + 1];

  useEffect(() => {
    const v = videoRef.current;
    if (v && playing && state.status === "ready") v.play().catch(() => {});
  }, [state, playing, videoRef]);

  return (
    <>
      <div
        ref={stageRef}
        className="relative aspect-video w-full overflow-hidden bg-black md:rounded-lg md:shadow-hero"
      >
        {playing ? (
          <>
            <video
              ref={videoRef}
              controls
              playsInline
              preload="auto"
              poster={current?.thumbnailUrl ?? undefined}
              className="size-full"
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
            />
            {state.status === "ready" && <SkipButtons videoRef={videoRef} />}
            <PlayerOverlay
              titleId={titleId}
              state={state}
              previewEnded={previewEnded}
              priceMnt={priceMnt}
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0">{backdrop}</div>
            <div className="absolute inset-0 hidden bg-gradient-to-t from-black via-black/70 to-black/10 md:block" />
            <div className="absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/40 to-transparent md:block" />
            <button
              type="button"
              aria-label="Тоглуулах"
              onClick={() => current && play()}
              className="absolute inset-0 grid place-items-center md:hidden"
            >
              <span className="grid size-14 place-items-center rounded-full bg-black/55 backdrop-blur">
                <IconPlay />
              </span>
            </button>
            <div className="absolute inset-0 hidden flex-col justify-end p-6 md:flex">
              {overlay}
            </div>
          </>
        )}
      </div>
      {playing && episodes.length > 1 && (
        <div className="flex items-center justify-between gap-4 px-4 pt-3 md:px-0">
          <p className="text-body-2 text-fg-muted">
            {current?.name || `${current?.number}-р анги`}
          </p>
          {next && (
            <button
              type="button"
              onClick={() => play(next.id)}
              className="shrink-0 rounded-lg border-[1.5px] border-brand-300 bg-brand-500 px-4 py-2 text-body-2 font-semibold"
            >
              Дараагийн анги →
            </button>
          )}
        </div>
      )}
    </>
  );
}

export function InlineEpisodes({ slug, hue }: { slug: string; hue?: number }) {
  const { episodes, current, play } = useWatch();
  return (
    <EpisodeList
      slug={slug}
      episodes={episodes}
      hue={hue}
      activeId={current?.id}
      onSelect={(e) => play(e.id)}
    />
  );
}
