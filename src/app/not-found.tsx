import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="grid flex-1 place-items-center px-4 py-24 text-center">
        <div className="flex max-w-sm flex-col items-center gap-4">
          <p className="font-display text-[56px] font-bold leading-none text-brand-300">404</p>
          <h1 className="text-h4 font-bold">Хуудас олдсонгүй</h1>
          <p className="text-body-2 text-fg-muted">Холбоос буруу эсвэл энэ бүтээл устгагдсан байж магадгүй.</p>
          <Link
            href="/"
            className="rounded-lg border-[1.5px] border-brand-300 bg-brand-500 text-on-brand px-6 py-3 text-body-2 font-semibold hover:bg-brand-400 text-on-brand"
          >
            Нүүр хуудас руу
          </Link>
        </div>
      </main>
    </>
  );
}
