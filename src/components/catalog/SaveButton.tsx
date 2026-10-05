"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconPlus } from "@/components/ui/icons";

/** Save / unsave a title. Sends signed-out users to login and back. */
export function SaveButton({
  titleId,
  slug,
  initial,
  variant,
  disabled,
}: {
  titleId: string;
  slug: string;
  initial: boolean;
  variant: "icon" | "tab" | "light";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (disabled || busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next);
    const res = await fetch(`/api/me/saved/${titleId}`, { method: next ? "PUT" : "DELETE" });
    setBusy(false);
    if (res.status === 401) {
      setSaved(!next);
      router.push(`/login?next=${encodeURIComponent(`/title/${slug}`)}`);
    } else if (!res.ok) {
      setSaved(!next);
    }
  }

  const label = saved ? "Хадгалсан" : "Хадгалах";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={saved}
        className={`rounded-lg border-[1.5px] border-brand-300 p-4 transition ${saved ? "bg-brand-500" : "bg-brand-400 hover:bg-brand-500"}`}
      >
        {saved ? (
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <IconPlus />
        )}
      </button>
    );
  }
  if (variant === "light") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        className="rounded-lg border-[1.5px] border-brand-100 bg-brand-50 px-6 py-3 text-[13px] font-medium leading-4 tracking-[0.5px] text-brand-500"
      >
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      className={`shrink-0 rounded-lg border-[1.5px] px-4 py-2 text-[14px] font-medium leading-6 ${
        saved ? "border-brand-400 bg-brand-500/20" : "border-stroke bg-black"
      }`}
    >
      {label}
    </button>
  );
}
