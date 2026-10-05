"use client";
import { useState } from "react";

/**
 * "Худалдан авах" button. The bank-transfer checkout (order code + admin approval)
 * is built on days 11–12; until then the modal explains what is coming.
 */
export function BuyButton({ priceMnt, className = "" }: { priceMnt: number; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-lg border-[1.5px] border-brand-100 bg-brand-50 font-semibold text-brand-500 transition hover:bg-white ${className}`}
      >
        Худалдан авах · {priceMnt.toLocaleString("mn-MN")}₮
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal
            className="w-full max-w-sm rounded-2xl border border-stroke bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-h4 font-bold">Худалдан авах</h2>
            <p className="mt-2 text-body-2 text-fg-muted">
              Нэг удаа {priceMnt.toLocaleString("mn-MN")}₮ төлөөд энэ киног хугацаагүй, хэдэн ч удаа үзнэ.
            </p>
            <p className="mt-4 rounded-lg bg-brand-500/10 px-3 py-2 text-body-2 text-brand-100">
              Төлбөрийн хэсэг удахгүй нээгдэнэ.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 h-11 w-full rounded-lg bg-brand-500 text-body-2 font-semibold hover:bg-brand-400"
            >
              Ойлголоо
            </button>
          </div>
        </div>
      )}
    </>
  );
}
