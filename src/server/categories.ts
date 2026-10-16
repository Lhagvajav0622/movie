import "server-only";
import { unstable_cache } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { demoGenres } from "@/lib/demo";

const { genres, titleGenres } = schema;

/** The category that age-gates its titles. It is wired into the app by its slug, so it cannot be renamed or deleted. */
export const ADULT_SLUG = "adult";

async function loadNavCategories(): Promise<string[]> {
  try {
    const rows = await db
      .select({ name: genres.nameMn })
      .from(genres)
      .orderBy(genres.sortOrder, genres.nameMn);
    if (rows.length) return rows.map((r) => r.name);
  } catch (e) {
    if (process.env.NODE_ENV === "production")
      console.error("[categories] query failed", e);
  }
  return demoGenres;
}

/** Category names for the menu, in the order the admin set. Admin edits clear it (tag "catalog"). */
export const getNavCategories = unstable_cache(
  loadNavCategories,
  ["nav-categories"],
  { tags: ["catalog"], revalidate: 60 },
);

/** Admin list: every category with the number of titles in it. */
export async function listCategoriesAdmin() {
  return db
    .select({
      id: genres.id,
      name: genres.nameMn,
      slug: genres.slug,
      sortOrder: genres.sortOrder,
      titleCount: sql<number>`count(${titleGenres.titleId})::int`,
    })
    .from(genres)
    .leftJoin(titleGenres, eq(titleGenres.genreId, genres.id))
    .groupBy(genres.id)
    .orderBy(genres.sortOrder, genres.nameMn);
}
