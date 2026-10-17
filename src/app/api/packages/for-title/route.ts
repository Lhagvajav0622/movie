import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { includesText, packageForTitle } from "@/server/packages";

const q = z.object({ titleId: z.string().uuid() });

/** The cheapest on-sale package that unlocks a title, for the locked-player overlay. */
export async function GET(req: Request) {
  const parsed = q.safeParse({ titleId: new URL(req.url).searchParams.get("titleId") });
  if (!parsed.success) return NextResponse.json({ package: null });
  const [t] = await db
    .select({ adult: schema.titles.isAdult })
    .from(schema.titles)
    .where(eq(schema.titles.id, parsed.data.titleId))
    .limit(1);
  if (!t) return NextResponse.json({ package: null });
  const names = await db
    .select({ name: schema.genres.nameMn })
    .from(schema.titleGenres)
    .innerJoin(schema.genres, eq(schema.genres.id, schema.titleGenres.genreId))
    .where(eq(schema.titleGenres.titleId, parsed.data.titleId));
  const p = await packageForTitle({ genres: names.map((n) => n.name), adult: t.adult });
  return NextResponse.json({
    package: p && { id: p.id, days: p.days, priceMnt: p.priceMnt, includes: includesText(p) },
  });
}
