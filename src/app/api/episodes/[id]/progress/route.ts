import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db";
import { getSession } from "@/server/auth";

type Ctx = { params: Promise<{ id: string }> };
const body = z.object({ positionSec: z.number().min(0).max(86400), durationSec: z.number().min(0).max(86400) });

/** Saves watch position (called every ~10 s and on pause / leave). Signed-out viewers are ignored. */
export async function PUT(req: Request, { params }: Ctx) {
  const s = await getSession().catch(() => null);
  if (!s) return new NextResponse(null, { status: 204 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ code: "BAD_ID" }, { status: 400 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "BAD_BODY" }, { status: 400 });

  const [ep] = await db
    .select({ titleId: schema.episodes.titleId })
    .from(schema.episodes)
    .where(eq(schema.episodes.id, id))
    .limit(1);
  if (!ep) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });

  const { positionSec, durationSec } = parsed.data;
  const completed = durationSec > 0 && positionSec >= durationSec * 0.95;
  const values = {
    userId: s.user.id,
    episodeId: id,
    titleId: ep.titleId,
    positionSec: Math.floor(positionSec),
    durationSec: Math.floor(durationSec),
    completed,
    updatedAt: new Date(),
  };
  await db
    .insert(schema.watchProgress)
    .values(values)
    .onConflictDoUpdate({
      target: [schema.watchProgress.userId, schema.watchProgress.episodeId],
      set: { positionSec: values.positionSec, durationSec: values.durationSec, completed, updatedAt: values.updatedAt },
    });
  return new NextResponse(null, { status: 204 });
}
