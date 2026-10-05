"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBookmark, IconHome, IconUser } from "@/components/ui/icons";

const items = [
  { href: "/", label: "Нүүр", Icon: IconHome },
  { href: "/saved", label: "Хадгалсан", Icon: IconBookmark },
  { href: "/profile", label: "Хэрэглэгч", Icon: IconUser },
];

/** Floating frosted tab bar from the mobile Figma (351×67, radius 16). */
export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-[19.5px] pb-[max(21px,env(safe-area-inset-bottom))] md:hidden">
      <ul className="glass flex h-[67px] w-full max-w-[351px] items-center justify-center gap-[23px] rounded-2xl">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex h-[67px] w-[70px] flex-col items-center justify-center gap-1 py-3 ${
                  active ? "text-brand-500" : "text-fg-muted"
                }`}
              >
                <Icon />
                <span className="text-[10px] font-medium leading-3">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
