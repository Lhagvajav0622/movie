import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "./db";

const { titles, savedTitles, watchProgress, episodes, purchases } = schema;

const titleCols = {
  id: titles.id,
  slug: titles.slug,
  name: titles.name,
  year: titles.year,
  type: titles.type,
  posterUrl: titles.posterUrl,
  priceMnt: titles.priceMnt,
  adult: titles.isAdult,
};

export async function listSaved(userId: string) {
  return db
    .select({ ...titleCols, at: savedTitles.createdAt })
    .from(savedTitles)
    .innerJoin(titles, eq(titles.id, savedTitles.titleId))
    .where(and(eq(savedTitles.userId, userId), eq(titles.status, "published")))
    .orderBy(desc(savedTitles.createdAt));
}

export async function listPurchased(userId: string) {
  return db
    .select({ ...titleCols, at: purchases.createdAt })
    .from(purchases)
    .innerJoin(titles, eq(titles.id, purchases.titleId))
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.createdAt));
}

/** Latest watched episode per title, newest first (powers History and "continue watching"). */
export async function listHistory(userId: string, limit = 50) {
  const latest = db
    .selectDistinctOn([watchProgress.titleId], {
      titleId: watchProgress.titleId,
      episodeId: watchProgress.episodeId,
      positionSec: watchProgress.positionSec,
      durationSec: watchProgress.durationSec,
      updatedAt: watchProgress.updatedAt,
    })
    .from(watchProgress)
    .where(eq(watchProgress.userId, userId))
    .orderBy(watchProgress.titleId, desc(watchProgress.updatedAt))
    .as("latest");

  return db
    .select({
      ...titleCols,
      episodeNumber: episodes.number,
      positionSec: latest.positionSec,
      durationSec: latest.durationSec,
      at: latest.updatedAt,
    })
    .from(latest)
    .innerJoin(titles, eq(titles.id, latest.titleId))
    .innerJoin(episodes, eq(episodes.id, latest.episodeId))
    .where(eq(titles.status, "published"))
    .orderBy(desc(latest.updatedAt))
    .limit(limit);
}

export { sql };
