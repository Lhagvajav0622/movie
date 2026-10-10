import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "./db";

const { titles, watchProgress, purchases, orders, user } = schema;

/** Overview numbers and rankings for the admin "Статистик" page. */
export async function getStats() {
  const [[totals], topTitles, topUsers] = await Promise.all([
    Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(user),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(titles)
        .where(eq(titles.status, "published")),
      db.select({ n: sql<number>`count(*)::int` }).from(purchases),
      db
        .select({
          sum: sql<number>`coalesce(sum(${orders.amountMnt}), 0)::int`,
        })
        .from(orders)
        .where(sql`${orders.status} = 'paid' and ${orders.isTest} = false`),
      db
        .select({
          sec: sql<number>`coalesce(sum(${watchProgress.positionSec}), 0)::bigint`,
        })
        .from(watchProgress),
      db
        .select({
          n: sql<number>`count(distinct ${watchProgress.userId})::int`,
        })
        .from(watchProgress)
        .where(sql`${watchProgress.updatedAt} > now() - interval '7 days'`),
    ]).then(([u, t, p, r, w, a]) => [
      {
        users: u[0].n,
        titles: t[0].n,
        purchases: p[0].n,
        revenue: r[0].sum,
        watchSec: Number(w[0].sec),
        activeWeek: a[0].n,
      },
    ]),
    db
      .select({
        id: titles.id,
        name: titles.name,
        viewers: sql<number>`count(distinct ${watchProgress.userId})::int`,
        watchSec: sql<number>`coalesce(sum(${watchProgress.positionSec}), 0)::bigint`,
        finished: sql<number>`count(*) filter (where ${watchProgress.completed})::int`,
        sales: sql<number>`(select count(*)::int from ${purchases} where ${purchases.titleId} = ${titles.id})`,
      })
      .from(watchProgress)
      .innerJoin(titles, eq(titles.id, watchProgress.titleId))
      .groupBy(titles.id)
      .orderBy(
        desc(sql`count(distinct ${watchProgress.userId})`),
        desc(sql`sum(${watchProgress.positionSec})`),
      )
      .limit(20),
    db
      .select({
        id: user.id,
        name: user.name,
        phone: user.phoneNumber,
        titles: sql<number>`count(distinct ${watchProgress.titleId})::int`,
        watchSec: sql<number>`coalesce(sum(${watchProgress.positionSec}), 0)::bigint`,
        last: sql<Date>`max(${watchProgress.updatedAt})`,
      })
      .from(watchProgress)
      .innerJoin(user, eq(user.id, watchProgress.userId))
      .groupBy(user.id)
      .orderBy(desc(sql`sum(${watchProgress.positionSec})`))
      .limit(20),
  ]);
  return {
    totals,
    topTitles: topTitles.map((t) => ({ ...t, watchSec: Number(t.watchSec) })),
    topUsers: topUsers.map((u) => ({ ...u, watchSec: Number(u.watchSec) })),
  };
}
