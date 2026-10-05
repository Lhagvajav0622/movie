import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "./db";

const { titles, genres, titleGenres, episodes } = schema;

export type TitleRowDb = typeof titles.$inferSelect;

/** Published titles with their genre names, newest first. */
export async function listPublishedTitles(limit = 60) {
  const rows = await db
    .select()
    .from(titles)
    .where(eq(titles.status, "published"))
    .orderBy(desc(titles.publishedAt))
    .limit(limit);
  return attachGenres(rows);
}

export async function attachGenres<T extends { id: string }>(rows: T[]) {
  if (!rows.length) return [] as (T & { genres: string[] })[];
  const links = await db
    .select({ titleId: titleGenres.titleId, name: genres.nameMn })
    .from(titleGenres)
    .innerJoin(genres, eq(genres.id, titleGenres.genreId))
    .where(inArray(titleGenres.titleId, rows.map((r) => r.id)));
  return rows.map((r) => ({ ...r, genres: links.filter((l) => l.titleId === r.id).map((l) => l.name) }));
}

export async function listGenres() {
  return db.select().from(genres).orderBy(genres.sortOrder);
}

/** Admin list: every title with episode counts. */
export async function listAllTitlesAdmin() {
  return db
    .select({
      id: titles.id,
      slug: titles.slug,
      name: titles.name,
      type: titles.type,
      orientation: titles.orientation,
      priceMnt: titles.priceMnt,
      status: titles.status,
      posterUrl: titles.posterUrl,
      updatedAt: titles.updatedAt,
      episodeCount: sql<number>`(select count(*)::int from ${episodes} where ${episodes.titleId} = ${titles.id})`,
    })
    .from(titles)
    .orderBy(desc(titles.updatedAt));
}

export async function getTitleForAdmin(id: string) {
  const [t] = await db.select().from(titles).where(eq(titles.id, id)).limit(1);
  if (!t) return null;
  const g = await db.select({ genreId: titleGenres.genreId }).from(titleGenres).where(eq(titleGenres.titleId, id));
  return { ...t, genreIds: g.map((x) => x.genreId) };
}

export async function slugTaken(slug: string, exceptId?: string) {
  const rows = await db.select({ id: titles.id }).from(titles).where(eq(titles.slug, slug)).limit(1);
  return rows.length > 0 && rows[0].id !== exceptId;
}

export async function listEpisodesAdmin(titleId: string) {
  return db
    .select({ id: episodes.id, number: episodes.number, durationSec: episodes.durationSec, status: episodes.status })
    .from(episodes)
    .where(eq(episodes.titleId, titleId))
    .orderBy(episodes.number);
}

export { and };
