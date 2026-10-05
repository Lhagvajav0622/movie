import Link from "next/link";

export function EmptyState({ text, hint }: { text: string; hint: string }) {
  return (
    <div className="px-4 py-20 text-center">
      <p className="text-body font-semibold">{text}</p>
      <p className="mt-1 text-body-2 text-fg-muted">{hint}</p>
      <Link href="/" className="mt-5 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-body-2 font-semibold">
        Кино үзэх
      </Link>
    </div>
  );
}
