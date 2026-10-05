"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconSearch } from "@/components/ui/icons";

/** Search field that updates ?q= after a short pause (keeps the selected genre). */
export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initial);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const p = new URLSearchParams(params.toString());
      if (q.trim()) p.set("q", q.trim());
      else p.delete("q");
      router.replace(`/search${p.size ? `?${p}` : ""}`, { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [q, params, router]);

  return (
    <label className="flex items-center gap-1 rounded-lg border border-stroke bg-black px-4 py-3 focus-within:border-brand-400">
      <IconSearch className="shrink-0 text-fg-muted" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Хайх"
        autoFocus={!initial}
        enterKeyHint="search"
        className="w-full bg-transparent text-body tracking-[0.2px] outline-none placeholder:text-fg-muted"
      />
    </label>
  );
}
