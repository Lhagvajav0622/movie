import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "./db";
import { generateOrderCode } from "./order-code";
import { providerFor, type PayMethod } from "./payments";

const { orders, purchases, titles } = schema;

export type CreateOrderResult =
  | { ok: true; order: typeof orders.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "FREE" | "OWNED" | "PROVIDER_ERROR" };

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
  const code = generateOrderCode();
  let invoiceId: string;
  try {
    ({ invoiceId } = await provider.createInvoice({ code, amountMnt: t.priceMnt, description: t.name }));
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
      providerInvoiceId: invoiceId,
      isTest: !provider.live,
    })
    .returning();
  return { ok: true, order };
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
    await tx
      .insert(purchases)
      .values({ userId: o.userId, titleId: o.titleId, orderId: o.id, source: "order" })
      .onConflictDoNothing();
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
      titleName: titles.name,
      userName: schema.user.name,
      userPhone: schema.user.phoneNumber,
    })
    .from(orders)
    .innerJoin(titles, eq(titles.id, orders.titleId))
    .innerJoin(schema.user, eq(schema.user.id, orders.userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}
