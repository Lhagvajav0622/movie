"use client";
import { useState } from "react";
import { MediaListItem, typeLabel } from "./MediaListItem";

type Row = {
  id: string;
  slug: string;
  name: string;
  posterUrl: string | null;
  priceMnt: number;
  year: number | null;
  type: "film" | "series";
};

/** Saved titles with a button to remove each one (removed right away, restored if the request fails). */
export function SavedList({ rows }: { rows: Row[] }) {
  const [items, setItems] = useState(rows);
  const [error, setError] = useState<string | null>(null);

  async function remove(row: Row) {
    setError(null);
    const index = items.findIndex((i) => i.id === row.id);
    setItems((cur) => cur.filter((i) => i.id !== row.id));
    const res = await fetch(`/api/me/saved/${row.id}`, {
      method: "DELETE",
    }).catch(() => null);
    if (!res || !res.ok) {
      setItems((cur) => {
        const next = [...cur];
        next.splice(Math.min(index, next.length), 0, row);
        return next;
      });
      setError("Хасаж чадсангүй. Дахин оролдоно уу.");
    }
  }

  if (!items.length) {
    return (
      <div className="px-4 py-16 text-center md:px-0">
        <p className="text-body font-semibold">Хадгалсан бүтээл алга.</p>
        <p className="mt-1 text-body-2 text-fg-muted">
          Киноны хуудсан дээрх «Хадгалах» товчийг дараарай.
        </p>
      </div>
    );
  }
  return (
    <>
      {error && (
        <p className="px-4 pb-3 text-body-2 text-red-400 md:px-0">{error}</p>
      )}
      <ul className="flex flex-col gap-4 px-4 md:px-0">
        {items.map((t) => (
          <MediaListItem
            key={t.id}
            href={`/title/${t.slug}`}
            t={t}
            meta={[t.year, typeLabel(t.type)].filter(Boolean).join(" • ")}
            action={
              <button
                type="button"
                onClick={() => remove(t)}
                aria-label={`«${t.name}»-г хадгалснаас хасах`}
                className="grid size-10 shrink-0 place-items-center rounded-full text-fg-subtle hover:bg-white/10 hover:text-fg active:bg-white/20"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            }
          />
        ))}
      </ul>
    </>
  );
}
