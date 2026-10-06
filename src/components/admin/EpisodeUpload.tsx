"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkFastStart, makeFastStart } from "@/lib/mp4";

type Props = {
  episodeId: string;
  kind: "full" | "preview";
  label: string;
  hint: string;
  /** minutes already uploaded, or null */
  uploadedMin: number | null;
};

const ERRORS: Record<string, string> = {
  NOT_CONFIGURED:
    "R2 тохиргоо Vercel дээр дутуу байна (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).",
  FORBIDDEN: "Админ эрх шаардлагатай.",
};

async function api(body: object) {
  const res = await fetch("/api/admin/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      ERRORS[j.code] ??
        `Серверийн алдаа${j.detail ? `: ${j.detail}` : j.code ? ` (${j.code})` : ""}`,
    );
  return j;
}

/** Reads the video length in the browser; also proves this browser can play the file (H.264 / AAC). */
function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (Number.isFinite(v.duration) && v.duration > 0) resolve(v.duration);
      else reject(new Error("duration"));
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("codec"));
    };
    v.src = url;
  });
}

/** PUT one part with progress, retrying a few times. Resolves with the part's ETag. */
function putPart(
  url: string,
  blob: Blob,
  onProgress: (loaded: number) => void,
): Promise<string> {
  const attempt = () =>
    new Promise<string>((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open("PUT", url);
      x.upload.onprogress = (e) => onProgress(e.loaded);
      x.onload = () => {
        const etag = x.getResponseHeader("ETag");
        if (x.status >= 200 && x.status < 300 && etag) resolve(etag);
        else reject(new Error(`part ${x.status}`));
      };
      x.onerror = () => reject(new Error("network"));
      x.send(blob);
    });
  return (async () => {
    for (let i = 1; ; i++) {
      try {
        onProgress(0);
        return await attempt();
      } catch (e) {
        if (i >= 3) throw e;
        await new Promise((r) => setTimeout(r, 1000 * i));
      }
    }
  })();
}

export function EpisodeUpload({
  episodeId,
  kind,
  label,
  hint,
  uploadedMin,
}: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setPct(0);
    let session: { uploadId: string } | null = null;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    try {
      if (!/\.mp4$/i.test(file.name) && file.type !== "video/mp4")
        throw new Error("Зөвхөн .mp4 файл оруулна уу.");
      const readAt = (f: Blob) => async (o: number, l: number) =>
        new Uint8Array(await f.slice(o, o + l).arrayBuffer());
      const fs = await checkFastStart(readAt(file), file.size);
      if (fs === "not-mp4") throw new Error("Энэ файл MP4 хэлбэр биш байна.");
      if (fs === "fragmented")
        throw new Error(
          'Энэ MP4 "fragmented" хэлбэртэй (ихэвчлэн YouTube-аас татсан файл) тул хөтөч дээр удаан эхэлнэ. Компьютер дээрээ `npm run faststart -- "файл.mp4"` ажиллуулж энгийн MP4 болгоод (хэдхэн секунд, чанар буурахгүй) дахин оруулна уу.',
        );
      let body: Blob = file;
      if (fs === "moov-last") {
        setNote("Файлыг тохируулж байна…");
        try {
          body = await makeFastStart(file);
        } catch {
          throw new Error(
            "Файлыг автоматаар тохируулж чадсангүй. Өөр MP4 (H.264) оруулж үзнэ үү.",
          );
        }
        if ((await checkFastStart(readAt(body), body.size)) !== "ok")
          throw new Error("Файлыг автоматаар тохируулж чадсангүй.");
        setNote(null);
      }
      const durationSec = await readDuration(file).catch((e) => {
        throw new Error(
          e.message === "codec"
            ? "Энэ видеог хөтөч тоглуулж чадсангүй. H.264 видео, AAC дуутай MP4 байх ёстой."
            : "Видеоны уртыг уншиж чадсангүй.",
        );
      });

      const start = await api({
        action: "start",
        episodeId,
        kind,
        size: body.size,
      });
      session = start;
      const { uploadId, partSize, partCount } = start as {
        uploadId: string;
        partSize: number;
        partCount: number;
      };
      const loaded = new Array<number>(partCount).fill(0);
      const report = () =>
        setPct(
          Math.min(
            99,
            Math.floor((loaded.reduce((a, b) => a + b, 0) / body.size) * 100),
          ),
        );
      const etags: { partNumber: number; etag: string }[] = [];

      // Hand out part URLs in small batches, upload 3 parts at a time.
      let next = 1;
      const worker = async () => {
        while (true) {
          const first = next;
          if (first > partCount) return;
          const batch = Array.from(
            { length: Math.min(3, partCount - first + 1) },
            (_, i) => first + i,
          );
          next += batch.length;
          const { urls } = await api({
            action: "parts",
            episodeId,
            kind,
            uploadId,
            partNumbers: batch,
          });
          for (const { partNumber, url } of urls as {
            partNumber: number;
            url: string;
          }[]) {
            const blob = body.slice(
              (partNumber - 1) * partSize,
              Math.min(body.size, partNumber * partSize),
            );
            const etag = await putPart(url, blob, (l) => {
              loaded[partNumber - 1] = l;
              report();
            });
            loaded[partNumber - 1] = blob.size;
            etags.push({ partNumber, etag });
          }
        }
      };
      await Promise.all([worker(), worker(), worker()]);

      await api({
        action: "complete",
        episodeId,
        kind,
        uploadId,
        durationSec,
        parts: etags,
      });
      setPct(100);
      router.refresh();
    } catch (e) {
      if (session)
        await api({
          action: "abort",
          episodeId,
          kind,
          uploadId: session.uploadId,
        }).catch(() => {});
      setError(e instanceof Error ? e.message : "Upload амжилтгүй.");
    } finally {
      window.removeEventListener("beforeunload", warn);
      setBusy(false);
      setNote(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="min-w-0 flex-1 rounded-lg border border-stroke p-3">
      <p className="text-body-2 font-medium">{label}</p>
      <p className="text-caption text-fg-subtle">{hint}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          ref={input}
          type="file"
          accept="video/mp4,.mp4"
          hidden
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="rounded-lg border border-stroke px-3 py-1.5 text-body-2 hover:border-brand-500 disabled:opacity-50"
        >
          {busy
            ? (note ?? `Оруулж байна… ${pct}%`)
            : uploadedMin !== null
              ? "Солих"
              : "MP4 сонгох"}
        </button>
        {uploadedMin !== null && !busy && (
          <span className="text-body-2 text-emerald-300">
            ✓ {uploadedMin} мин
          </span>
        )}
        {uploadedMin === null && !busy && (
          <span className="text-caption text-fg-subtle">Оруулаагүй</span>
        )}
      </div>
      {busy && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {error && (
        <p className="mt-2 whitespace-pre-wrap text-caption text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
