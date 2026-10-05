import Link from "next/link";
import { IconChevronRight, IconChevronRightSm } from "@/components/ui/icons";

/** Section title row. Mobile: 15px semibold + 16px chevron. Desktop: H4 28/36 bold + large chevron. */
export function SectionHeader({ title, href, right }: { title: string; href?: string; right?: React.ReactNode }) {
  return (
    <div className="flex h-8 items-center justify-between">
      <h2 className="text-[15px] font-semibold leading-6 md:text-[28px] md:font-bold md:leading-9">{title}</h2>
      {right}
      {href && !right && (
        <Link href={href} aria-label="Бүгдийг харах" className="text-fg">
          <IconChevronRightSm className="md:hidden" />
          <IconChevronRight className="hidden md:block" />
        </Link>
      )}
    </div>
  );
}

export function HScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:gap-10 md:px-0 ${className}`}
    >
      {children}
    </div>
  );
}
