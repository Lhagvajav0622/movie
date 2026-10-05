"use client";
import { useEffect, useRef, useState, type RefObject } from "react";

const SKIP = 15;

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Seek bar, ±15 s skip, play/pause and volume for a <video>. `limitSec` caps seeking during a free preview. */
export function PlayerControls({
  videoRef,
  limitSec,
  className = "",
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  limitSec?: number | null;
  className?: string;
}) {
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [dragging, setDragging] = useState<number | null>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const sync = () => {
      setTime(v.currentTime);
      setDuration(v.duration || 0);
      setPaused(v.paused);
      setMuted(v.muted);
      setVolume(v.volume);
    };
    const events = ["timeupdate", "durationchange", "loadedmetadata", "play", "pause", "volumechange"];
    events.forEach((e) => v.addEventListener(e, sync));
    sync();
    return () => events.forEach((e) => v.removeEventListener(e, sync));
  }, [videoRef]);

  const max = () => {
    const v = videoRef.current;
    const d = v?.duration || duration;
    return limitSec ? Math.min(limitSec, d || limitSec) : d;
  };
  const seekTo = (t: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(t, max() || t));
  };
  const skip = (d: number) => {
    const v = videoRef.current;
    if (v) seekTo(v.currentTime + d);
  };
  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  const fromPointer = (clientX: number) => {
    const r = bar.current?.getBoundingClientRect();
    if (!r || !duration) return 0;
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * duration;
  };

  const shown = dragging ?? time;
  const pct = duration ? (shown / duration) * 100 : 0;
  const btn = "grid size-10 place-items-center rounded-full text-[11px] font-bold hover:bg-white/15 active:bg-white/25";

  return (
    <div className={`flex flex-col gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
      <div
        ref={bar}
        role="slider"
        aria-label="Явц"
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration)}
        aria-valuenow={Math.floor(shown)}
        tabIndex={0}
        className="group relative flex h-6 cursor-pointer items-center [touch-action:none]"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(Math.min(fromPointer(e.clientX), max() || Infinity));
        }}
        onPointerMove={(e) => {
          if (dragging !== null) setDragging(Math.min(fromPointer(e.clientX), max() || Infinity));
        }}
        onPointerUp={(e) => {
          seekTo(fromPointer(e.clientX));
          setDragging(null);
        }}
        onPointerCancel={() => setDragging(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") skip(5);
          if (e.key === "ArrowLeft") skip(-5);
        }}
      >
        <div className="h-1 w-full rounded-full bg-white/25 group-hover:h-1.5">
          <div className="h-full rounded-full bg-brand-400" style={{ width: `${pct}%` }} />
        </div>
        <div
          className="absolute size-3 -translate-x-1/2 rounded-full bg-white shadow"
          style={{ left: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-1 text-body-2">
        <button type="button" className={btn} onClick={() => skip(-SKIP)} aria-label={`${SKIP} секунд ухраах`}>
          ↺{SKIP}
        </button>
        <button type="button" className={btn} onClick={toggle} aria-label={paused ? "Тоглуулах" : "Зогсоох"}>
          {paused ? "▶" : "❚❚"}
        </button>
        <button type="button" className={btn} onClick={() => skip(SKIP)} aria-label={`${SKIP} секунд урагшлуулах`}>
          {SKIP}↻
        </button>
        <span className="ml-1 tabular-nums text-fg-muted">
          {fmt(shown)} / {fmt(duration)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            aria-label="Дууны хэмжээ"
            className="hidden w-20 accent-brand-400 md:block"
            onChange={(e) => {
              const v = videoRef.current;
              if (!v) return;
              v.volume = Number(e.target.value);
              v.muted = v.volume === 0;
            }}
          />
          <button
            type="button"
            className={btn}
            aria-label={muted ? "Дуу нээх" : "Дуу хаах"}
            onClick={() => {
              const v = videoRef.current;
              if (v) v.muted = !v.muted;
            }}
          >
            {muted || volume === 0 ? "🔇" : "🔊"}
          </button>
        </div>
      </div>
    </div>
  );
}
