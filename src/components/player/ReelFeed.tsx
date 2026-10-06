"use client";
import { useEffect, useRef, useState } from "react";
import { usePlayback, playWithSound } from "./usePlayback";
import { PlayerOverlay } from "./PlayerOverlay";
import { PlayerControls } from "./PlayerControls";
import { IconArrowLeft, IconLock, IconPlayLarge } from "@/components/ui/icons";
import type { EpisodeView } from "@/server/title";

type Props = {
  slug: string;
  titleName: string;
  episodes: EpisodeView[];
  startNumber: number;
  titleId: string;
  priceMnt: number;
};

/**
 * Vertical (9:16) swipe feed for short dramas: one episode per screen, scroll-snap,
 * only the visible episode loads video. Next episode starts automatically.
 */
export function ReelFeed({ titleId, slug, titleName, episodes, startNumber, priceMnt }: Props) {
  const startIndex = Math.max(0, episodes.findIndex((e) => e.number === startNumber));
  const [active, setActive] = useState(startIndex);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [sheet, setSheet] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Jump to the requested episode on first render.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: startIndex * el.clientHeight });
  }, [startIndex]);

  // Track which slide is visible.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { root: el, threshold: [0.6] },
    );
    el.querySelectorAll("[data-index]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [episodes.length]);

  // Keep the URL in sync without re-rendering the page.
  useEffect(() => {
    const ep = episodes[active];
    if (ep) window.history.replaceState(null, "", `/watch/${slug}/${ep.number}`);
  }, [active, episodes, slug]);

  const goTo = (i: number) => {
    const el = scroller.current;
    if (el && i >= 0 && i < episodes.length) el.scrollTo({ top: i * el.clientHeight, behavior: "smooth" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Desktop: a centered 9:16 "phone" stage; mobile: full screen */}
      <div className="relative mx-auto h-dvh w-full md:max-w-[calc(100dvh*9/16)] md:overflow-hidden">
      <div ref={scroller} className="no-scrollbar h-dvh snap-y snap-mandatory overflow-y-auto">
        {episodes.map((ep, i) => (
          <section key={ep.id} data-index={i} className="relative flex h-dvh snap-start snap-always items-center justify-center">
            {Math.abs(i - active) <= 1 ? (
              <ReelItem
                episode={ep}
                active={i === active}
                titleId={titleId}
                priceMnt={priceMnt}
               
                onEnded={() => goTo(i + 1)}
                onSoundBlocked={setSoundBlocked}
              />
            ) : (
              <div className="size-full bg-black" />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-4 right-20">
              <p className="text-body font-bold">{titleName}</p>
              <p className="text-body-2 text-fg-muted">
                {ep.number}-р анги / {episodes.length}
              </p>
            </div>
          </section>
        ))}
      </div>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex h-14 items-center bg-gradient-to-b from-black/70 to-transparent pt-[env(safe-area-inset-top)]">
        <a href={`/title/${slug}`} aria-label="Буцах" className="p-4">
          <IconArrowLeft />
        </a>
        <p className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-body font-bold">{titleName}</p>
      </div>

      {/* Right rail */}
      <div className="absolute bottom-28 right-3 flex flex-col items-center gap-5">
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="glass grid size-12 place-items-center rounded-2xl text-caption font-semibold"
          aria-label="Ангиуд"
        >
          {episodes[active]?.number ?? 1}
        </button>
      </div>

      {soundBlocked && (
        <button
          type="button"
          onClick={() => {
            document.querySelectorAll<HTMLVideoElement>("video[data-active='true']").forEach((v) => (v.muted = false));
            setSoundBlocked(false);
          }}
          className="glass absolute left-1/2 top-16 -translate-x-1/2 rounded-full px-4 py-2 text-body-2"
        >
          🔇 Дуу нээх
        </button>
      )}

      {/* Episode sheet */}
      {sheet && (
        <div className="absolute inset-0 z-10 flex items-end bg-black/60" onClick={() => setSheet(false)}>
          <div
            className="max-h-[70dvh] w-full overflow-y-auto rounded-t-2xl border-t border-stroke bg-surface p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-body font-bold">Ангиуд</p>
            <div className="grid grid-cols-6 gap-2">
              {episodes.map((ep, i) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => {
                    setSheet(false);
                    goTo(i);
                  }}
                  className={`relative grid h-11 place-items-center rounded-lg text-body-2 font-semibold ${
                    i === active ? "bg-brand-500" : "bg-surface-2"
                  }`}
                >
                  {ep.number}
                  {ep.access === "locked" && (
                    <span className="absolute right-1 top-1 text-fg-muted">
                      <IconLock size={10} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Desktop only: previous / next episode */}
      <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        <button
          type="button"
          aria-label="Өмнөх анги"
          disabled={active <= 0}
          onClick={() => goTo(active - 1)}
          className="glass grid size-12 place-items-center rounded-full disabled:opacity-30"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>
        </button>
        <button
          type="button"
          aria-label="Дараагийн анги"
          disabled={active >= episodes.length - 1}
          onClick={() => goTo(active + 1)}
          className="glass grid size-12 place-items-center rounded-full disabled:opacity-30"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </div>
    </div>
  );
}

function ReelItem({
  episode,
  active,
  titleId,
  priceMnt,
  onEnded,
  onSoundBlocked,
}: {
  episode: EpisodeView;
  active: boolean;
  titleId: string;
  priceMnt: number;
  onEnded: () => void;
  onSoundBlocked: (b: boolean) => void;
}) {
  const { videoRef, state, previewEnded } = usePlayback(episode.id, active);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || state.status !== "ready") return;
    if (active) {
      const start = () => playWithSound(v).then((r) => onSoundBlocked(r === "muted"));
      if (v.readyState >= 2) start();
      else v.addEventListener("canplay", start, { once: true });
      return () => v.removeEventListener("canplay", start);
    }
    v.pause();
  }, [active, state, videoRef, onSoundBlocked]);

  return (
    <div className="relative size-full">
      <video
        ref={videoRef}
        data-active={active}
        playsInline
        preload="auto"
        poster={episode.thumbnailUrl ?? undefined}
        className="size-full object-cover md:object-contain"
        onClick={(e) => {
          const v = e.currentTarget;
          if (v.paused) v.play().catch(() => {});
          else v.pause();
        }}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration) setProgress(v.currentTime / v.duration);
        }}
        onEnded={() => {
          if (state.status === "ready" && state.info.access === "full") onEnded();
        }}
      />
      {paused && state.status === "ready" && !previewEnded && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="glass grid size-16 place-items-center rounded-2xl">
            <IconPlayLarge />
          </span>
        </div>
      )}
      {state.status === "ready" && active && (
        <PlayerControls
          videoRef={videoRef}
          limitSec={state.info.access === "preview" ? state.info.allowedSec : null}
          className="absolute inset-x-4 bottom-[88px] z-10 md:left-1/2 md:right-auto md:w-[520px] md:-translate-x-1/2"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/15">
        <div className="h-full bg-brand-400" style={{ width: `${progress * 100}%` }} />
      </div>
      {active && <PlayerOverlay titleId={titleId} state={state} previewEnded={previewEnded} priceMnt={priceMnt} />}
    </div>
  );
}
