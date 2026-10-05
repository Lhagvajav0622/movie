/** Database helpers for command-line scripts (the app's db module is server-only). */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";
import * as schema from "../../src/server/db/schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set in .env");
const client = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(client, { schema });

export async function findTitleBySlug(slug: string) {
  const [t] = await db.select().from(schema.titles).where(eq(schema.titles.slug, slug)).limit(1);
  return t ?? null;
}

/** Returns the id of episode `number` of the title, creating it (status processing) if needed. */
export async function upsertEpisode(titleId: string, number: number) {
  const [existing] = await db
    .select({ id: schema.episodes.id })
    .from(schema.episodes)
    .where(and(eq(schema.episodes.titleId, titleId), eq(schema.episodes.number, number)))
    .limit(1);
  if (existing) {
    await db.update(schema.episodes).set({ status: "processing" }).where(eq(schema.episodes.id, existing.id));
    return existing.id;
  }
  const [row] = await db
    .insert(schema.episodes)
    .values({ titleId, number, status: "processing" })
    .returning({ id: schema.episodes.id });
  return row.id;
}

export async function markEpisodeReady(
  id: string,
  v: { videoKey: string; durationSec: number; segmentSec: number; thumbnailUrl: string },
) {
  await db.update(schema.episodes).set({ ...v, status: "ready" }).where(eq(schema.episodes.id, id));
}

export const close = () => client.end();
