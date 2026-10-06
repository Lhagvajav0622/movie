"use client";
import { useRef, useState } from "react";

/** Shrinks an image in the browser (so the upload is small and fast) and returns a WebP blob. */
async function shrink(file: File, maxWidth: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bmp.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/webp", 0.85),
  );
}

const ERRORS: Record<string, string> = {
  NOT_CONFIGURED: "Зураг хадгалах тохиргоо (R2) Vercel дээр дутуу байна.",
  FORBIDDEN: "Админ эрх шаардлагатай.",
  TOO_BIG: "Зураг хэт том байна.",
  BAD_TYPE: "Зөвхөн JPG, PNG, WebP зураг оруулна уу.",
};

/** "Зураг сонгох" button that uploads to R2 and hands the public URL back through onChange. */
export function ImageUpload({ onChange, maxWidth }: { onChange: (url: string) => void; maxWidth: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await shrink(file, maxWidth);
      const body = new FormData();
      body.append("file", new File([blob], "image.webp", { type: "image/webp" }));
      const res = await fetch("/api/admin/upload-image", { method: "POST", body });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(ERRORS[j.code] ?? `Upload амжилтгүй${j.detail ? `: ${j.detail}` : j.code ? ` (${j.code})` : ""}`);
      onChange(j.url);
    } catch (e) {
      setError(e instanceof Error && e.message !== "encode" ? e.message : "Зургийг боловсруулж чадсангүй.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="rounded-lg border border-stroke px-4 py-2 text-body-2 font-medium hover:border-brand-500 disabled:opacity-50"
      >
        {busy ? "Оруулж байна…" : "Зураг сонгох"}
      </button>
      {error && <span className="text-body-2 text-red-400">{error}</span>}
    </div>
  );
}
