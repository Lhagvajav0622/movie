import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { hasTitleAccess } from "@/server/grants";
import { getSession } from "@/server/auth";
import { episodeAccess } from "@/server/access";
import { signMp4Url, signPlaybackUrl, videoConfigured } from "@/server/video";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Returns a short-lived signed HLS URL for an episode.
 * Unpaid viewers get a URL whose free-preview limit is enforced by the video Worker.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });

  const [ep] = await db.select().from(schema.episodes).where(eq(schema.episodes.id, id)).limit(1);
  if (!ep || ep.status !== "ready" || !(ep.videoKey || ep.fullMp4Key || ep.previewMp4Key)) return NextResponse.json({ code: "NOT_READY" }, { status: 404 });
  const [title] = await db
    .select()
    .from(schema.titles)
    .where(and(eq(schema.titles.id, ep.titleId), eq(schema.titles.status, "published")))
    .limit(1);
  if (!title) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });

  const session = await getSession().catch(() => null);
  const userId = session?.user.id ?? null;

  let owned = false;
  let resumeSec = 0;
  if (userId) {
    owned = await hasTitleAccess(userId, title.id);
    const [w] = await db
      .select({ pos: schema.watchProgress.positionSec, done: schema.watchProgress.completed })
      .from(schema.watchProgress)
      .where(and(eq(schema.watchProgress.userId, userId), eq(schema.watchProgress.episodeId, ep.id)))
      .limit(1);
    if (w && !w.done) resumeSec = w.pos;
  }

  const all = await db
    .select({
      id: schema.episodes.id,
      number: schema.episodes.number,
      durationSec: schema.episodes.durationSec,
      videoKey: schema.episodes.videoKey,
      fullMp4Key: schema.episodes.fullMp4Key,
      previewMp4Key: schema.episodes.previewMp4Key,
    })
    .from(schema.episodes)
    .where(and(eq(schema.episodes.titleId, title.id), eq(schema.episodes.status, "ready")))
    .orderBy(asc(schema.episodes.number));

  const access = episodeAccess({
    priceMnt: title.priceMnt,
    freePreviewSec: title.freePreviewSec,
    owned,
    episodes: all.map((e) => ({
      id: e.id,
      number: e.number,
      durationSec: e.durationSec,
      hasPreviewClip: Boolean(e.previewMp4Key),
      hasFull: Boolean(e.fullMp4Key || e.videoKey),
      hasHls: Boolean(e.videoKey),
    })),
    episodeId: ep.id,
  });

  if (access.kind === "locked") {
    return NextResponse.json({ code: "PAYMENT_REQUIRED", priceMnt: title.priceMnt }, { status: 402 });
  }
  if (!videoConfigured()) return NextResponse.json({ code: "VIDEO_NOT_CONFIGURED" }, { status: 503 });

  // Pick the file: the separate free clip, the full MP4, or the legacy HLS (cut by time for previews).
  let url: string;
  let kind: "mp4" | "hls" = "mp4";
  let limitSec = 0;
  let shownAccess: "full" | "preview" = "full";
  let durationSec = ep.durationSec;
  if (access.kind === "clip") {
    url = signMp4Url(ep.id, "preview");
    shownAccess = "preview";
    durationSec = ep.previewDurationSec || ep.durationSec;
  } else if (access.kind === "preview") {
    if (!ep.videoKey) return NextResponse.json({ code: "NOT_READY" }, { status: 404 });
    kind = "hls";
    limitSec = access.allowedSec;
    shownAccess = "preview";
    url = signPlaybackUrl({ episodeId: ep.id, videoKey: ep.videoKey, limitSec, segmentSec: ep.segmentSec });
  } else if (ep.fullMp4Key) {
    url = signMp4Url(ep.id, "full");
  } else if (ep.videoKey) {
    kind = "hls";
    url = signPlaybackUrl({ episodeId: ep.id, videoKey: ep.videoKey, limitSec: 0, segmentSec: ep.segmentSec });
  } else {
    // A free episode that only has the clip file
    url = signMp4Url(ep.id, "preview");
    durationSec = ep.previewDurationSec || ep.durationSec;
  }

  return NextResponse.json(
    {
      url,
      kind,
      access: shownAccess,
      allowedSec: limitSec || null,
      resumeSec: limitSec ? Math.min(resumeSec, Math.max(0, limitSec - 5)) : resumeSec,
      durationSec,
      priceMnt: title.priceMnt,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
