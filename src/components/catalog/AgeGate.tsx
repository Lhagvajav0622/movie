"use client";
import Link from "next/link";

/** Marks this browser as 18+ for a year. Visibility is handled by CSS (see globals.css), so no re-render is needed. */
function confirm18() {
  document.cookie = "age18=1; path=/; max-age=31536000; samesite=lax";
  document.documentElement.dataset.age18 = "1";
}

/**
 * Asks "are you 18 or older?" until the viewer answers yes.
 * `banner` sits above a list; `overlay` covers a whole page (title page of a +18 film).
 * This is a courtesy gate (a remembered answer), not identity verification.
 */
export function AgeGate({ variant }: { variant: "banner" | "overlay" }) {
  const body = (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="rounded-full border-2 border-white px-3 py-1 text-[18px] font-extrabold">
        +18
      </span>
      <p className="text-body font-semibold">Та 18 нас хүрсэн үү?</p>
      <p className="max-w-[320px] text-body-2 text-fg-muted">
        Энэ ангилалд насанд хүрэгчдэд зориулсан агуулга байна.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirm18}
          className="rounded-lg bg-brand-500 px-5 py-2 text-body-2 font-bold"
        >
          Тийм, 18 хүрсэн
        </button>
        <Link
          href="/"
          className="rounded-lg border border-stroke px-5 py-2 text-body-2 font-medium"
        >
          Үгүй
        </Link>
      </div>
    </div>
  );
  if (variant === "banner")
    return (
      <div
        data-age-gate
        className="rounded-xl border border-stroke bg-surface-2 p-4"
      >
        {body}
      </div>
    );
  return (
    <div
      data-age-gate
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6 backdrop-blur-md"
    >
      {body}
    </div>
  );
}
