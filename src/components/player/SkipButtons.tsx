"use client";
import type { RefObject } from "react";

/** −15 / +15 second buttons over the sides of a <video> (the native controls stay at the bottom). */
export function SkipButtons({
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const skip = (d: number) => {
    const v = videoRef.current;
    if (!v) return;
    const end = Number.isFinite(v.duration) ? v.duration : Infinity;
    v.currentTime = Math.max(0, Math.min(v.currentTime + d, end));
  };
  const cls =
    "pointer-events-auto grid size-11 place-items-center rounded-full bg-black/45 text-[12px] font-bold text-white backdrop-blur hover:bg-black/65 active:scale-95";
  return (
    <div className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
      <button
        type="button"
        aria-label="15 секунд ухрах"
        onClick={() => skip(-15)}
        className={cls}
      >
        −15
      </button>
      <button
        type="button"
        aria-label="15 секунд түрүүлэх"
        onClick={() => skip(15)}
        className={cls}
      >
        +15
      </button>
    </div>
  );
}
