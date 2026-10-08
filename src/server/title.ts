import "server-only";
import { cache } from "react";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "./db";
import { attachGenres } from "./catalog";
import { episodeAccess } from "./access";
import { hasTitleAccess } from "./grants";
import { demoTitles } from "@/lib/demo";

export type EpisodeView = {
  id: string;
  number: number;
  name: string | null;
  durationSec: number;
  thumbnailUrl: string | null;
  access: "full" | "preview" | "clip" | "locked";
};

export type SimilarView = { adult?: boolean; slug: string; name: string; year: number | null; posterUrl: string | null; priceMnt: number; hue?: number };

export type TitleDetail = {
  id: string;
  slug: string;
  name: string;
  nameOriginal: string | null;
  description: string | null;
  type: "film" | "series";
  orientation: "vertical" | "horizontal";
  year: number | null;
  ageRating: string | null;
  country: string | null;
  director: string | null;
  castText: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  priceMnt: number;
  freePreviewSec: number;
  genres: string[];
  adult?: boolean;
  episodes: EpisodeView[];
  totalDurationSec: number;
  owned: boolean;
  saved: boolean;
  similar: SimilarView[];
  hue?: number;
  isDemo?: boolean;
};

/** Light query for <head> metadata (one row, no episodes / genres). */
export const getTitleMeta = cache(async (slug: string) => {
  if (slug.startsWith("demo-")) {
    const d = demoTitles.find((t) => t.slug === slug);
    return d ? { name: d.name, description: d.description ?? null, image: null as string | null } : null;
  }
  const [t] = await db
    .select({
      name: schema.titles.name,
      description: schema.titles.description,
      backdropUrl: schema.titles.backdropUrl,
      posterUrl: schema.titles.posterUrl,
    })
    .from(schema.titles)
    .where(and(eq(schema.titles.slug, slug), eq(schema.titles.status, "published")))
    .limit(1);
  return t ? { name: t.name, description: t.description, image: t.backdropUrl ?? t.posterUrl } : null;
});

export async function getTitleDetail(slug: string, userId?: string | null): Promise<TitleDetail | null> {
  if (slug.startsWith("demo-")) return demoDetail(slug);

  const [t] = await db
    .select()
    .from(schema.titles)
    .where(and(eq(schema.titles.slug, slug), eq(schema.titles.status, "published")))
    .limit(1);
  if (!t) return null;

  // Independent queries run at the same time (each one is a network round trip to the database).
  const [[withGenres], eps, ownedAccess, savedRows, genreIds] = await Promise.all([
    attachGenres([t]),
    db
      .select()
      .from(schema.episodes)
      .where(and(eq(schema.episodes.titleId, t.id), eq(schema.episodes.status, "ready")))
      .orderBy(asc(schema.episodes.number)),
    userId ? hasTitleAccess(userId, t.id) : Promise.resolve(false),
    userId
      ? db
          .select({ u: schema.savedTitles.userId })
          .from(schema.savedTitles)
          .where(and(eq(schema.savedTitles.userId, userId), eq(schema.savedTitles.titleId, t.id)))
          .limit(1)
      : Promise.resolve([]),
    db.select({ id: schema.titleGenres.genreId }).from(schema.titleGenres).where(eq(schema.titleGenres.titleId, t.id)),
  ]);
  const owned = ownedAccess;
  const saved = savedRows.length > 0;

  const lite = eps.map((e) => ({
    id: e.id,
    number: e.number,
    durationSec: e.durationSec,
    hasPreviewClip: Boolean(e.previewMp4Key),
    hasFull: Boolean(e.fullMp4Key || e.videoKey),
    hasHls: Boolean(e.videoKey),
  }));
  const episodes: EpisodeView[] = eps.map((e) => ({
    id: e.id,
    number: e.number,
    name: e.name,
    durationSec: e.durationSec,
    thumbnailUrl: e.thumbnailUrl,
    access: episodeAccess({
      priceMnt: t.priceMnt,
      freePreviewSec: t.freePreviewSec,
      owned,
      episodes: lite,
      episodeId: e.id,
    }).kind,
  }));

  // Similar: other published titles sharing a genre, newest first.
  let similar: SimilarView[] = [];
  if (genreIds.length) {
    similar = await db
      .selectDistinct({
        slug: schema.titles.slug,
        name: schema.titles.name,
        year: schema.titles.year,
        posterUrl: schema.titles.posterUrl,
        priceMnt: schema.titles.priceMnt,
        adult: schema.titles.isAdult,
      })
      .from(schema.titles)
      .innerJoin(schema.titleGenres, eq(schema.titleGenres.titleId, schema.titles.id))
      .where(
        and(
          eq(schema.titles.status, "published"),
          ne(schema.titles.id, t.id),
          inArray(
            schema.titleGenres.genreId,
            genreIds.map((g) => g.id),
          ),
        ),
      )
      .limit(12);
  }

  return {
    ...withGenres,
    adult: t.isAdult,
    episodes,
    totalDurationSec: eps.reduce((s, e) => s + e.durationSec, 0),
    owned,
    saved,
    similar,
  };
}

/** Detail page for the demo catalog, so links from the preview home work. */
function demoDetail(slug: string): TitleDetail | null {
  const d = demoTitles.find((t) => t.slug === slug);
  if (!d) return null;
  const count = d.vertical ? 12 : 1;
  const len = d.vertical ? 150 : (d.durationSec ?? 7200);
  const lite = Array.from({ length: count }, (_, i) => ({ id: `${slug}-${i + 1}`, number: i + 1, durationSec: len }));
  return {
    id: slug,
    slug,
    name: d.name,
    nameOriginal: null,
    description: d.description ?? null,
    type: d.vertical ? "series" : "film",
    orientation: d.vertical ? "vertical" : "horizontal",
    year: d.year ?? null,
    ageRating: d.ageRating ?? null,
    country: "Хятад",
    director: "—",
    castText: null,
    posterUrl: null,
    backdropUrl: null,
    priceMnt: d.priceMnt,
    freePreviewSec: 300,
    genres: d.genres,
    episodes: lite.map((e) => ({
      ...e,
      name: null,
      thumbnailUrl: null,
      access: episodeAccess({ priceMnt: d.priceMnt, freePreviewSec: 300, owned: false, episodes: lite, episodeId: e.id }).kind,
    })),
    totalDurationSec: count * len,
    owned: false,
    saved: false,
    similar: demoTitles
      .filter((t) => t.slug !== slug && t.genres.some((g) => d.genres.includes(g)))
      .map((t) => ({ slug: t.slug, name: t.name, year: t.year ?? null, posterUrl: null, priceMnt: t.priceMnt, hue: t.hue })),
    hue: d.hue,
    isDemo: true,
  };
}
