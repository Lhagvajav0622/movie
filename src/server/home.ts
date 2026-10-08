import "server-only";
import { unstable_cache } from "next/cache";
import { listPublishedTitles } from "./catalog";
import { demoGenres, demoTitles } from "@/lib/demo";
import type { GenreItem } from "@/components/catalog/GenreSection";

export type HomeItem = GenreItem & { vertical: boolean; isFeatured?: boolean };

function hueFrom(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/**
 * Home data: published titles from the database. While the catalog is empty
 * (or the database is unreachable in local dev) the demo set is shown so the page is never blank.
 */
async function loadHomeData(): Promise<{
  items: HomeItem[];
  genres: string[];
  isDemo: boolean;
}> {
  try {
    const rows = await listPublishedTitles(60);
    if (rows.length > 0) {
      const items: HomeItem[] = rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        year: r.year,
        posterUrl: r.posterUrl,
        backdropUrl: r.backdropUrl,
        hue: hueFrom(r.slug),
        priceMnt: r.priceMnt,
        description: r.description,
        ageRating: r.ageRating,
        durationSec: null,
        genres: r.genres,
        vertical: r.orientation === "vertical",
        isFeatured: r.isFeatured,
        adult: r.isAdult,
      }));
      const used = new Set(items.flatMap((i) => i.genres));
      const genres = demoGenres
        .filter((g) => used.has(g))
        .concat([...used].filter((g) => !demoGenres.includes(g)));
      return {
        items,
        genres: genres.length ? genres : demoGenres,
        isDemo: false,
      };
    }
  } catch (e) {
    if (process.env.NODE_ENV === "production")
      console.error("[home] catalog query failed", e);
  }
  return { items: demoTitles, genres: demoGenres, isDemo: true };
}

/**
 * Same for every visitor, so it is cached for a minute instead of hitting the database on every page view.
 * Admin changes clear it immediately (updateTag("catalog") in the admin actions).
 */
export const getHomeData = unstable_cache(loadHomeData, ["home-data"], {
  tags: ["catalog"],
  revalidate: 60,
});
