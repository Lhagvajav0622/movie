import "server-only";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { proActive } from "@/lib/pro";

const { user, purchases, titles, userAccess, orders } = schema;

/** Can this user watch the whole title? Bought it, was given it, or has a valid Pro pass. */
export async function hasTitleAccess(
  userId: string,
  titleId: string,
): Promise<boolean> {
  const [[p], [a], pass] = await Promise.all([
    db
      .select({ u: purchases.userId })
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.titleId, titleId)))
      .limit(1),
    db
      .select({ expiresAt: userAccess.expiresAt })
      .from(userAccess)
      .where(eq(userAccess.userId, userId))
      .limit(1),
    // A running category pass covers the title when it matches one of the title's categories,
    // or when it is "Бүх багц" (every title except +18).
    db.execute<{ ok: number }>(sql`
      select 1 as ok
      from package_subs ps
      join packages pk on pk.id = ps.package_id
      where ps.user_id = ${userId}
        and ps.expires_at > now()
        and (
          (pk.genre_id is null and not exists (select 1 from titles t where t.id = ${titleId} and t.is_adult))
          or pk.genre_id in (select genre_id from title_genres where title_id = ${titleId})
        )
      limit 1`),
  ]);
  return Boolean(p) || proActive(a) || pass.length > 0;
}

export async function listUsersAdmin(q: string) {
  const needle = q.trim();
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      phone: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
      bought: sql<number>`(select count(*)::int from ${purchases} where ${purchases.userId} = ${user.id})`,
      proExpiresAt: userAccess.expiresAt,
      hasPro: sql<boolean>`${userAccess.userId} is not null`,
    })
    .from(user)
    .leftJoin(userAccess, eq(userAccess.userId, user.id))
    .where(
      needle
        ? or(
            ilike(user.phoneNumber, `%${needle}%`),
            ilike(user.name, `%${needle}%`),
          )
        : undefined,
    )
    .orderBy(desc(user.createdAt))
    .limit(200);
  return rows;
}

export async function getUserAdmin(id: string) {
  const [u] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  if (!u) return null;
  const [owned, pro, orderRows] = await Promise.all([
    db
      .select({
        titleId: purchases.titleId,
        name: titles.name,
        source: purchases.source,
        createdAt: purchases.createdAt,
      })
      .from(purchases)
      .innerJoin(titles, eq(titles.id, purchases.titleId))
      .where(eq(purchases.userId, id))
      .orderBy(desc(purchases.createdAt)),
    db.select().from(userAccess).where(eq(userAccess.userId, id)).limit(1),
    db
      .select({
        amountMnt: orders.amountMnt,
        status: orders.status,
        isTest: orders.isTest,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, id))
      .orderBy(desc(orders.createdAt))
      .limit(20),
  ]);
  return { user: u, owned, pro: pro[0] ?? null, orders: orderRows };
}

export async function grantTitle(userId: string, titleId: string) {
  await db
    .insert(purchases)
    .values({ userId, titleId, source: "admin" })
    .onConflictDoNothing();
}

export async function revokeTitle(userId: string, titleId: string) {
  await db
    .delete(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.titleId, titleId)));
}

/** days = null → no end date. Granting again replaces the previous end date. */
export async function setPro(userId: string, days: number | null) {
  const expiresAt = days ? new Date(Date.now() + days * 86_400_000) : null;
  await db
    .insert(userAccess)
    .values({ userId, expiresAt })
    .onConflictDoUpdate({ target: userAccess.userId, set: { expiresAt } });
}

export async function revokePro(userId: string) {
  await db.delete(userAccess).where(eq(userAccess.userId, userId));
}
