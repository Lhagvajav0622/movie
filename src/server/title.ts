import "server-only";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "./db";
import { attachGenres } from "./catalog";
import { episodeAccess } from "./access";
import { demoTitles } from "@/lib/demo";

export type EpisodeView = {
  id: string;
  number: number;
  name: string | null;
  durationSec: number;
  thumbnailUrl: string | null;
  access: "full" | "preview" | "locked";
};

export type SimilarView = { slug: string; name: string; year: number | null; posterUrl: string | null; priceMnt: number; hue?: number };

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
  episodes: EpisodeView[];
  totalDurationSec: number;
  owned: boolean;
  saved: boolean;
  similar: SimilarView[];
  hue?: number;
  isDemo?: boolean;
};

export async function getTitleDetail(slug: string, userId?: string | null): Promise<TitleDetail | null> {
  if (slug.startsWith("demo-")) return demoDetail(slug);

  const [t] = await db
    .select()
    .from(schema.titles)
    .where(and(eq(schema.titles.slug, slug), eq(schema.titles.status, "published")))
    .limit(1);
  if (!t) return null;

  const [withGenres] = await attachGenres([t]);
  const eps = await db
    .select()
    .from(schema.episodes)
    .where(and(eq(schema.episodes.titleId, t.id), eq(schema.episodes.status, "ready")))
    .orderBy(asc(schema.episodes.number));

  let owned = false;
  let saved = false;
  if (userId) {
    const [p] = await db
      .select({ u: schema.purchases.userId })
      .from(schema.purchases)
      .where(and(eq(schema.purchases.userId, userId), eq(schema.purchases.titleId, t.id)))
      .limit(1);
    owned = Boolean(p);
    const [s] = await db
      .select({ u: schema.savedTitles.userId })
      .from(schema.savedTitles)
      .where(and(eq(schema.savedTitles.userId, userId), eq(schema.savedTitles.titleId, t.id)))
      .limit(1);
    saved = Boolean(s);
  }

  const lite = eps.map((e) => ({ id: e.id, number: e.number, durationSec: e.durationSec }));
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
  const genreIds = await db
    .select({ id: schema.titleGenres.genreId })
    .from(schema.titleGenres)
    .where(eq(schema.titleGenres.titleId, t.id));
  if (genreIds.length) {
    similar = await db
      .selectDistinct({
        slug: schema.titles.slug,
        name: schema.titles.name,
        year: schema.titles.year,
        posterUrl: schema.titles.posterUrl,
        priceMnt: schema.titles.priceMnt,
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
