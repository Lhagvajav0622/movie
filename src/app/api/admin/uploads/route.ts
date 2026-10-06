import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { abortMultipart, completeMultipart, imageStorageConfigured, presignParts, startMultipart } from "@/server/storage";
import { mp4Keys } from "@/server/video";

/** 32 MiB parts: a 3 GB film is ~100 parts (R2 allows up to 10,000, minimum 5 MiB). */
const PART_SIZE = 32 * 1024 * 1024;
const MAX_BYTES = 12 * 1024 * 1024 * 1024;

const base = { episodeId: z.string().uuid(), kind: z.enum(["full", "preview"]) };
const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), ...base, size: z.number().int().positive().max(MAX_BYTES) }),
  z.object({ action: z.literal("parts"), ...base, uploadId: z.string().min(1), partNumbers: z.array(z.number().int().min(1).max(10000)).min(1).max(50) }),
  z.object({
    action: z.literal("complete"),
    ...base,
    uploadId: z.string().min(1),
    durationSec: z.number().min(1).max(60 * 60 * 6),
    parts: z.array(z.object({ partNumber: z.number().int().min(1), etag: z.string().min(1) })).min(1),
  }),
  z.object({ action: z.literal("abort"), ...base, uploadId: z.string().min(1) }),
]);

/** Admin only. Multipart upload of an episode's full MP4 or free-preview MP4 straight from the browser to R2. */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  if (!imageStorageConfigured()) return NextResponse.json({ code: "NOT_CONFIGURED" }, { status: 503 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "BAD_REQUEST" }, { status: 400 });
  const b = parsed.data;

  const [ep] = await db.select().from(schema.episodes).where(eq(schema.episodes.id, b.episodeId)).limit(1);
  if (!ep) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  // The R2 key is always derived here, never taken from the browser.
  const key = mp4Keys(ep.id)[b.kind].key;

  try {
    if (b.action === "start") {
      const uploadId = await startMultipart(key, "video/mp4");
      return NextResponse.json({ uploadId, partSize: PART_SIZE, partCount: Math.ceil(b.size / PART_SIZE) });
    }
    if (b.action === "parts") {
      return NextResponse.json({ urls: await presignParts(key, b.uploadId, b.partNumbers) });
    }
    if (b.action === "abort") {
      await abortMultipart(key, b.uploadId);
      return NextResponse.json({ ok: true });
    }

    await completeMultipart(key, b.uploadId, b.parts);
    const hasFull = b.kind === "full" || Boolean(ep.fullMp4Key || ep.videoKey);
    await db
      .update(schema.episodes)
      .set(
        b.kind === "full"
          ? { fullMp4Key: key, durationSec: Math.round(b.durationSec), status: "ready" as const }
          : {
              previewMp4Key: key,
              previewDurationSec: Math.round(b.durationSec),
              // A clip with no paid version is the whole (free) episode, so it defines the episode length.
              ...(hasFull ? {} : { durationSec: Math.round(b.durationSec) }),
              status: "ready" as const,
            },
      )
      .where(eq(schema.episodes.id, ep.id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ code: "UPLOAD_FAILED" }, { status: 502 });
  }
}
