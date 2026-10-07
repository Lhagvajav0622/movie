"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalRouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-dvh flex-1 place-items-center px-4 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <h1 className="text-h4 font-bold">Алдаа гарлаа</h1>
        <p className="text-body-2 text-fg-muted">
          Түр зуурын саатал байж магадгүй. Дахин оролдоно уу, үргэлжилбэл түр хүлээгээд ороорой.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-lg border-[1.5px] border-brand-300 bg-brand-500 px-6 py-3 text-body-2 font-semibold hover:bg-brand-400"
          >
            Дахин оролдох
          </button>
          <Link href="/" className="rounded-lg border border-stroke px-6 py-3 text-body-2 font-semibold hover:border-brand-500">
            Нүүр
          </Link>
        </div>
      </div>
    </main>
  );
}
