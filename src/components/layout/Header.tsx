import Link from "next/link";

const nav = [
  { href: "/", label: "Нүүр" },
  { href: "/search", label: "Категори" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-black via-black/80 to-transparent">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-8 px-4 md:px-10">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Mhub
        </Link>
        <nav className="hidden items-center gap-6 text-body-2 text-fg-muted md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <IconLink href="/search" label="Хайх">
            <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.35-4.35" />
          </IconLink>
          <IconLink href="/profile" label="Профайл">
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
          </IconLink>
        </div>
      </div>
    </header>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid size-10 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </Link>
  );
}
