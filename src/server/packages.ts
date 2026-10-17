import "server-only";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "./db";

const { packages, packageSubs, genres } = schema;

export type PackageRow = {
  id: string | null;
  genreId: string | null;
  name: string;
  slug: string;
  priceMnt: number;
  days: number;
};

/** Every package slot for the admin: "Бүх багц" first, then one per category (price 0 = not on sale). */
export async function listPackagesAdmin(): Promise<PackageRow[]> {
  const [all, cats] = await Promise.all([
    db.select().from(packages).where(isNull(packages.genreId)).limit(1),
    db
      .select({
        genreId: genres.id,
        name: genres.nameMn,
        slug: genres.slug,
        id: packages.id,
        priceMnt: packages.priceMnt,
        days: packages.days,
      })
      .from(genres)
      .leftJoin(packages, eq(packages.genreId, genres.id))
      .orderBy(asc(genres.sortOrder), asc(genres.nameMn)),
  ]);
  return [
    {
      id: all[0]?.id ?? null,
      genreId: null,
      name: "Бүх багц",
      slug: "all",
      priceMnt: all[0]?.priceMnt ?? 0,
      days: all[0]?.days ?? 30,
    },
    ...cats.map((c) => ({
      id: c.id ?? null,
      genreId: c.genreId,
      name: c.name,
      slug: c.slug,
      priceMnt: c.priceMnt ?? 0,
      days: c.days ?? 30,
    })),
  ];
}

/** Packages on sale (price > 0), with this user's pass end date when they have one. */
export async function listPackagesForSale(userId?: string) {
  const rows = await listPackagesAdmin();
  const onSale = rows.filter((r) => r.id && r.priceMnt > 0);
  const subs = userId
    ? await db
        .select({ packageId: packageSubs.packageId, expiresAt: packageSubs.expiresAt })
        .from(packageSubs)
        .where(and(eq(packageSubs.userId, userId), gt(packageSubs.expiresAt, new Date())))
    : [];
  const until = new Map(subs.map((s) => [s.packageId, s.expiresAt]));
  return onSale.map((r) => ({ ...r, id: r.id!, activeUntil: until.get(r.id!) ?? null }));
}

/** The on-sale package for one category name (for the banner on a category page). */
export async function packageForCategory(name: string) {
  const rows = await listPackagesForSale();
  return rows.find((r) => r.name === name) ?? null;
}
