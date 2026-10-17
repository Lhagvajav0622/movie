import "server-only";
import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { db, schema } from "./db";

const { packages, packageGenres, packageSubs, genres } = schema;

export type PackageInfo = {
  id: string;
  name: string;
  badge: string | null;
  description: string | null;
  priceMnt: number;
  oldPriceMnt: number | null;
  days: number;
  highlighted: boolean;
  allTitles: boolean;
  active: boolean;
  sortOrder: number;
  /** ids and names of the categories the package unlocks (empty when allTitles only) */
  genreIds: string[];
  genreNames: string[];
};

/** Every package with its categories, in display order. */
export async function listPackagesAdmin(): Promise<PackageInfo[]> {
  const [pk, links] = await Promise.all([
    db.select().from(packages).orderBy(asc(packages.sortOrder), asc(packages.createdAt)),
    db
      .select({ packageId: packageGenres.packageId, id: genres.id, name: genres.nameMn, sort: genres.sortOrder })
      .from(packageGenres)
      .innerJoin(genres, eq(genres.id, packageGenres.genreId))
      .orderBy(asc(genres.sortOrder), asc(genres.nameMn)),
  ]);
  return pk.map((p) => {
    const mine = links.filter((l) => l.packageId === p.id);
    return { ...p, genreIds: mine.map((l) => l.id), genreNames: mine.map((l) => l.name) };
  });
}

/** Names shown to buyers: "Бүх кино" and/or the category names. */
export const includesText = (p: Pick<PackageInfo, "allTitles" | "genreNames">) =>
  [...(p.allTitles ? ["Бүх кино (+18-аас бусад)"] : []), ...p.genreNames].join(", ");

/** Packages on sale (active, price > 0), with this user's pass end date when they have one. */
export async function listPackagesForSale(userId?: string) {
  const onSale = (await listPackagesAdmin()).filter((p) => p.active && p.priceMnt > 0);
  const subs =
    userId && onSale.length
      ? await db
          .select({ packageId: packageSubs.packageId, expiresAt: packageSubs.expiresAt })
          .from(packageSubs)
          .where(
            and(
              eq(packageSubs.userId, userId),
              gt(packageSubs.expiresAt, new Date()),
              inArray(packageSubs.packageId, onSale.map((p) => p.id)),
            ),
          )
      : [];
  const until = new Map(subs.map((s) => [s.packageId, s.expiresAt]));
  return onSale.map((p) => ({ ...p, activeUntil: until.get(p.id) ?? null }));
}

/** The cheapest on-sale package that includes one category (banner on a category page). */
export async function packageForCategory(name: string) {
  const rows = await listPackagesForSale();
  return rows.filter((r) => r.genreNames.includes(name)).sort((a, b) => a.priceMnt - b.priceMnt)[0] ?? null;
}

/** The cheapest on-sale package that unlocks one title (shown next to its "Худалдан авах" button). */
export async function packageForTitle(t: { genres: string[]; adult?: boolean }) {
  const rows = await listPackagesForSale();
  return (
    rows
      .filter((r) => (r.allTitles && !t.adult) || r.genreNames.some((g) => t.genres.includes(g)))
      .sort((a, b) => a.priceMnt - b.priceMnt)[0] ?? null
  );
}
