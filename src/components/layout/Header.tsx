"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconChevronDown, IconHome, IconSearch, IconUser } from "@/components/ui/icons";
import { demoGenres } from "@/lib/demo";

/** Desktop header (Figma "Header / home", 1088 wide). Hidden on mobile, which uses its own top bar. */
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const homeActive = path === "/";

  return (
    <header className="sticky top-0 z-40 hidden bg-black/90 backdrop-blur md:block">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-4">
        <Link href="/" className="text-[28px] font-bold leading-9">
          Mhub
        </Link>
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className={`flex items-center gap-2 text-body font-medium ${homeActive ? "text-brand-500" : "text-fg"}`}
          >
            <IconHome />
            Нүүр
          </Link>
          <div className="relative" onMouseLeave={() => setOpen(false)}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              onMouseEnter={() => setOpen(true)}
              className="flex items-center gap-2 text-body font-medium"
              aria-expanded={open}
            >
              Категори
              <IconChevronDown />
            </button>
            {open && (
              <div className="absolute left-0 top-full z-50 w-48 rounded-lg border border-stroke bg-surface p-2 shadow-xl">
                {demoGenres.map((g) => (
                  <Link
                    key={g}
                    href={`/search?genre=${encodeURIComponent(g)}`}
                    className="block rounded-md px-3 py-2 text-body-2 text-fg-muted hover:bg-surface-2 hover:text-fg"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/search" aria-label="Хайх" className="rounded-lg p-4 hover:bg-surface-2">
              <IconSearch />
            </Link>
            <Link href="/profile" aria-label="Профайл" className="rounded-lg p-4 hover:bg-surface-2">
              <IconUser />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
