"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Method = "qpay" | "socialpay";
type Step =
  | { s: "choose" }
  | { s: "creating"; method: Method }
  | { s: "pay"; id: string; code: string; mode: "test" | "live"; method: Method }
  | { s: "paying" }
  | { s: "done" };

const METHODS: { id: Method; label: string }[] = [
  { id: "qpay", label: "QPay" },
  { id: "socialpay", label: "SocialPay" },
];

/**
 * "Худалдан авах" button + checkout modal. Talks to /api/orders; in test mode (PAYMENT_MODE=test)
 * the buyer confirms with one click, in live mode it polls the order until the provider reports paid.
 */
export function BuyButton({
  titleId,
  priceMnt,
  className = "",
}: {
  titleId: string;
  priceMnt: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ s: "choose" });
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const price = `${priceMnt.toLocaleString("mn-MN")}₮`;

  function close() {
    if (step.s === "paying") return;
    setOpen(false);
    setStep({ s: "choose" });
    setError(null);
  }

  async function start(method: Method) {
    setError(null);
    setStep({ s: "creating", method });
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId, method }),
    }).catch(() => null);
    if (res?.status === 401) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!res || !res.ok) {
      const j = res ? await res.json().catch(() => ({})) : {};
      setError(
        j.code === "OWNED"
          ? "Та энэ киног аль хэдийн худалдаж авсан байна."
          : "Захиалга үүсгэж чадсангүй. Дахин оролдоно уу.",
      );
      setStep({ s: "choose" });
      if (j.code === "OWNED") window.location.reload();
      return;
    }
    const o = await res.json();
    setStep({ s: "pay", id: o.id, code: o.code, mode: o.mode, method });
  }

  async function testPay(id: string) {
    setStep({ s: "paying" });
    const res = await fetch(`/api/orders/${id}/test-pay`, { method: "POST" }).catch(() => null);
    if (!res || !res.ok) {
      setError("Төлбөр баталгаажсангүй. Дахин оролдоно уу.");
      setStep({ s: "choose" });
      return;
    }
    setStep({ s: "done" });
  }

  // Live mode: poll the order until the provider says it is paid.
  const liveId = step.s === "pay" && step.mode === "live" ? step.id : null;
  useEffect(() => {
    if (!liveId) return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/orders/${liveId}`, { cache: "no-store" }).catch(() => null);
      const j = r?.ok ? await r.json() : null;
      if (j?.status === "paid") setStep({ s: "done" });
    }, 3000);
    return () => clearInterval(t);
  }, [liveId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-lg border-[1.5px] border-brand-100 bg-brand-50 font-semibold text-brand-500 transition hover:bg-white ${className}`}
      >
        Худалдан авах · {price}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={close}>
          <div
            role="dialog"
            aria-modal
            className="w-full max-w-sm rounded-2xl border border-stroke bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-h4 font-bold">Худалдан авах</h2>

            {(step.s === "choose" || step.s === "creating") && (
              <>
                <p className="mt-2 text-body-2 text-fg-muted">
                  Нэг удаа {price} төлөөд энэ киног хугацаагүй, хэдэн ч удаа үзнэ.
                </p>
                <p className="mt-4 text-body-2 font-semibold">Төлбөрийн хэлбэр</p>
                <div className="mt-2 flex flex-col gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={step.s === "creating"}
                      onClick={() => start(m.id)}
                      className="flex h-12 items-center justify-between rounded-lg border border-stroke px-4 text-body-2 font-semibold transition hover:border-brand-500 disabled:opacity-50"
                    >
                      <span>{m.label}</span>
                      <span className="text-fg-muted">
                        {step.s === "creating" && step.method === m.id ? "…" : price}
                      </span>
                    </button>
                  ))}
                </div>
                {error && <p className="mt-3 text-body-2 text-red-400">{error}</p>}
              </>
            )}

            {step.s === "pay" && (
              <>
                <dl className="mt-3 flex flex-col gap-1 text-body-2">
                  <div className="flex justify-between">
                    <dt className="text-fg-muted">Төлбөрийн хэлбэр</dt>
                    <dd>{step.method === "qpay" ? "QPay" : "SocialPay"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-fg-muted">Захиалгын код</dt>
                    <dd className="font-mono">{step.code}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-fg-muted">Дүн</dt>
                    <dd className="font-semibold">{price}</dd>
                  </div>
                </dl>
                {step.mode === "test" ? (
                  <>
                    <p className="mt-4 rounded-lg bg-brand-500/10 px-3 py-2 text-body-2 text-brand-100">
                      ТЕСТ ГОРИМ: бодит төлбөр хийгдэхгүй. Доорх товчийг дарахад худалдан авалт баталгаажиж, кино нээгдэнэ.
                    </p>
                    <button
                      type="button"
                      onClick={() => testPay(step.id)}
                      className="mt-4 h-11 w-full rounded-lg bg-brand-500 text-body-2 font-semibold hover:bg-brand-400"
                    >
                      Төлбөр төлөх (тест)
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-body-2 text-fg-muted">
                    Банкны апп-аараа төлбөрөө төлнө үү. Төлбөр орсны дараа энэ цонх автоматаар шинэчлэгдэнэ.
                  </p>
                )}
              </>
            )}

            {step.s === "paying" && <p className="mt-4 text-body-2 text-fg-muted">Баталгаажуулж байна…</p>}

            {step.s === "done" && (
              <>
                <p className="mt-3 rounded-lg bg-brand-500/10 px-3 py-2 text-body-2 text-brand-100">
                  Амжилттай! Худалдан авалт баталгаажлаа.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 h-11 w-full rounded-lg bg-brand-500 text-body-2 font-semibold hover:bg-brand-400"
                >
                  Үзэх
                </button>
              </>
            )}

            {step.s !== "done" && step.s !== "paying" && (
              <button
                type="button"
                onClick={close}
                className="mt-3 h-11 w-full rounded-lg text-body-2 text-fg-muted hover:text-white"
              >
                Болих
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
