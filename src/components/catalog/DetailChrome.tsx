"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconArrowLeft } from "@/components/ui/icons";

/** Arrow that goes one step back in history; `fallback` is used when the page was opened directly (no history). */
export function BackArrow({ fallback = "/", className = "p-4" }: { fallback?: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Буцах"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className={className}
    >
      <IconArrowLeft />
    </button>
  );
}

/** Mobile "Navigation Bar": back arrow + centered title. */
/** `href` set → the arrow always goes there (e.g. Search → Home) instead of one step back in history. */
export function BackBar({ title, href }: { title: string; href?: string }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center bg-black/90 backdrop-blur md:hidden">
      <button
        type="button"
        aria-label="Буцах"
        onClick={() =>
          href
            ? router.push(href)
            : window.history.length > 1
              ? router.back()
              : router.push("/")
        }
        className="p-4"
      >
        <IconArrowLeft />
      </button>
      <p className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-body font-bold tracking-[0.3px]">
        {title}
      </p>
    </div>
  );
}

/** Mobile "ContentNavigation" segmented control (Ангиуд / Дэлгэрэнгүй). */
export function DetailTabs({
  tabs,
}: {
  tabs: { label: string; content: React.ReactNode }[];
}) {
  const [i, setI] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        className="flex gap-2 rounded-[8.8px] border border-stroke bg-black p-0.5"
      >
        {tabs.map((t, idx) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={i === idx}
            onClick={() => setI(idx)}
            className={`flex-1 rounded-lg px-2.5 py-1 text-[12px] font-semibold leading-5 tracking-[0.1px] ${
              i === idx ? "bg-[#3e3c3c] text-fg" : "text-fg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tabs[i]?.content}</div>
    </div>
  );
}
