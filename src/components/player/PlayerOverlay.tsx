"use client";
import { BuyButton } from "@/components/payment/BuyButton";
import { IconLock } from "@/components/ui/icons";
import type { PlayState } from "./usePlayback";

/** Shown over the player when an episode is locked, the free preview ended, or video is missing. */
export function PlayerOverlay({
  state,
  previewEnded,
  priceMnt,
  freeMinutes,
}: {
  state: PlayState;
  previewEnded: boolean;
  priceMnt: number;
  freeMinutes: number;
}) {
  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }
  if (state.status === "unavailable" || state.status === "error") {
    return (
      <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
        <p className="text-body-2 text-fg-muted">
          {state.status === "error" ? "Алдаа гарлаа. Дахин оролдоно уу." : "Энэ ангийн видео хараахан байршаагүй байна."}
        </p>
      </div>
    );
  }
  if (state.status === "locked" || previewEnded) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-black/80 p-6">
        <div className="flex max-w-xs flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-brand-500/20 text-brand-200">
            <IconLock size={24} />
          </span>
          <p className="text-body font-bold">
            {previewEnded ? `Үнэгүй ${freeMinutes} минут дууслаа` : "Энэ анги түгжээтэй"}
          </p>
          <p className="text-body-2 text-fg-muted">Нэг удаа худалдаж аваад хугацаагүй үзээрэй.</p>
          <BuyButton priceMnt={priceMnt} className="mt-1 h-11 w-full text-[14px]" />
        </div>
      </div>
    );
  }
  return null;
}
