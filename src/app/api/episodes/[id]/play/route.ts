import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getSession } from "@/server/auth";
import { episodeAccess } from "@/server/access";
import { signPlaybackUrl, videoConfigured } from "@/server/video";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Returns a short-lived signed HLS URL for an episode.
 * Unpaid viewers get a URL whose free-preview limit is enforced by the video Worker.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });

  const [ep] = await db.select().from(schema.episodes).where(eq(schema.episodes.id, id)).limit(1);
  if (!ep || ep.status !== "ready" || !ep.videoKey) return NextResponse.json({ code: "NOT_READY" }, { status: 404 });
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
    const [p] = await db
      .select({ u: schema.purchases.userId })
      .from(schema.purchases)
      .where(and(eq(schema.purchases.userId, userId), eq(schema.purchases.titleId, title.id)))
      .limit(1);
    owned = Boolean(p);
    const [w] = await db
      .select({ pos: schema.watchProgress.positionSec, done: schema.watchProgress.completed })
      .from(schema.watchProgress)
      .where(and(eq(schema.watchProgress.userId, userId), eq(schema.watchProgress.episodeId, ep.id)))
      .limit(1);
    if (w && !w.done) resumeSec = w.pos;
  }

  const all = await db
    .select({ id: schema.episodes.id, number: schema.episodes.number, durationSec: schema.episodes.durationSec })
    .from(schema.episodes)
    .where(and(eq(schema.episodes.titleId, title.id), eq(schema.episodes.status, "ready")))
    .orderBy(asc(schema.episodes.number));

  const access = episodeAccess({
    priceMnt: title.priceMnt,
    freePreviewSec: title.freePreviewSec,
    owned,
    episodes: all,
    episodeId: ep.id,
  });

  if (access.kind === "locked") {
    return NextResponse.json({ code: "PAYMENT_REQUIRED", priceMnt: title.priceMnt }, { status: 402 });
  }
  if (!videoConfigured()) return NextResponse.json({ code: "VIDEO_NOT_CONFIGURED" }, { status: 503 });

  const limitSec = access.kind === "preview" ? access.allowedSec : 0;
  const url = signPlaybackUrl({ episodeId: ep.id, videoKey: ep.videoKey, limitSec, segmentSec: ep.segmentSec });

  return NextResponse.json(
    {
      url,
      access: access.kind,
      allowedSec: limitSec || null,
      resumeSec: limitSec ? Math.min(resumeSec, Math.max(0, limitSec - 5)) : resumeSec,
      durationSec: ep.durationSec,
      priceMnt: title.priceMnt,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
