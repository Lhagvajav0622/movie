import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { extendPass } from "@/lib/package-pass";
import { db, schema } from "./db";
import { generateOrderCode } from "./order-code";
import { providerFor, type PayMethod } from "./payments";
import type { Invoice } from "./payments/types";

const { orders, purchases, titles, packages, packageSubs, genres } = schema;

export type CreateOrderResult =
  | { ok: true; order: typeof orders.$inferSelect; invoice: Invoice }
  | { ok: false; code: "NOT_FOUND" | "FREE" | "OWNED" | "PROVIDER_ERROR" | "UNAVAILABLE" };

/** Create (or reuse the open) order for a user + title and ask the provider for an invoice. */
export async function createOrder(userId: string, titleId: string, method: PayMethod): Promise<CreateOrderResult> {
  const [t] = await db
    .select({ id: titles.id, name: titles.name, priceMnt: titles.priceMnt })
    .from(titles)
    .where(and(eq(titles.id, titleId), eq(titles.status, "published")))
    .limit(1);
  if (!t) return { ok: false, code: "NOT_FOUND" };
  if (t.priceMnt <= 0) return { ok: false, code: "FREE" };

  const [owned] = await db
    .select({ u: purchases.userId })
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.titleId, titleId)))
    .limit(1);
  if (owned) return { ok: false, code: "OWNED" };

  const provider = providerFor(method);
  if (!provider.available()) return { ok: false, code: "UNAVAILABLE" };
  const code = generateOrderCode();
  let invoice: Invoice;
  try {
    invoice = await provider.createInvoice({ code, amountMnt: t.priceMnt, description: t.name });
  } catch {
    return { ok: false, code: "PROVIDER_ERROR" };
  }

  const [order] = await db
    .insert(orders)
    .values({
      code,
      userId,
      titleId,
      amountMnt: t.priceMnt, // price is always read server-side, never from the client
      method,
      status: "pending",
      providerInvoiceId: invoice.invoiceId,
      isTest: !provider.live,
    })
    .returning();
  return { ok: true, order, invoice };
}

/** Buy a category pass (limited days). The price and length come from the DB. */
export async function createPackageOrder(userId: string, packageId: string, method: PayMethod): Promise<CreateOrderResult> {
  const [p] = await db
    .select({ id: packages.id, priceMnt: packages.priceMnt, days: packages.days, genreName: genres.nameMn })
    .from(packages)
    .leftJoin(genres, eq(genres.id, packages.genreId))
    .where(eq(packages.id, packageId))
    .limit(1);
  if (!p || p.priceMnt <= 0) return { ok: false, code: "NOT_FOUND" };

  const provider = providerFor(method);
  if (!provider.available()) return { ok: false, code: "UNAVAILABLE" };
  const code = generateOrderCode();
  const name = `${p.genreName ?? "Бүх багц"} · ${p.days} хоног`;
  let invoice: Invoice;
  try {
    invoice = await provider.createInvoice({ code, amountMnt: p.priceMnt, description: name });
  } catch {
    return { ok: false, code: "PROVIDER_ERROR" };
  }
  const [order] = await db
    .insert(orders)
    .values({
      code,
      userId,
      packageId,
      amountMnt: p.priceMnt,
      method,
      status: "pending",
      providerInvoiceId: invoice.invoiceId,
      isTest: !provider.live,
    })
    .returning();
  return { ok: true, order, invoice };
}

export async function getOrderFor(userId: string, orderId: string) {
  const [o] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  return o ?? null;
}

/** Mark an order paid and grant lifetime access. Safe to call twice (webhook + polling). */
export async function settleOrder(orderId: string) {
  return db.transaction(async (tx) => {
    const [o] = await tx
      .update(orders)
      .set({ status: "paid", paidAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .returning();
    if (!o) {
      const [existing] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      return existing ?? null;
    }
    if (o.packageId) {
      const [pkg] = await tx.select({ days: packages.days }).from(packages).where(eq(packages.id, o.packageId)).limit(1);
      const [cur] = await tx
        .select({ expiresAt: packageSubs.expiresAt })
        .from(packageSubs)
        .where(and(eq(packageSubs.userId, o.userId), eq(packageSubs.packageId, o.packageId)))
        .limit(1);
      const expiresAt = extendPass(cur?.expiresAt, pkg?.days ?? 30);
      await tx
        .insert(packageSubs)
        .values({ userId: o.userId, packageId: o.packageId, expiresAt })
        .onConflictDoUpdate({ target: [packageSubs.userId, packageSubs.packageId], set: { expiresAt } });
    } else if (o.titleId) {
      await tx
        .insert(purchases)
        .values({ userId: o.userId, titleId: o.titleId, orderId: o.id, source: "order" })
        .onConflictDoNothing();
    }
    return o;
  });
}

export async function listOrdersAdmin(limit = 100) {
  return db
    .select({
      id: orders.id,
      code: orders.code,
      amountMnt: orders.amountMnt,
      method: orders.method,
      status: orders.status,
      isTest: orders.isTest,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
      titleName: sql<string>`coalesce(${titles.name}, 'Багц: ' || coalesce(${genres.nameMn}, 'Бүх багц'))`,
      userName: schema.user.name,
      userPhone: schema.user.phoneNumber,
    })
    .from(orders)
    .leftJoin(titles, eq(titles.id, orders.titleId))
    .leftJoin(packages, eq(packages.id, orders.packageId))
    .leftJoin(genres, eq(genres.id, packages.genreId))
    .innerJoin(schema.user, eq(schema.user.id, orders.userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}
