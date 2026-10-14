import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { settleOrder } from "@/server/orders";
import { providerFor } from "@/server/payments";

/**
 * QPay calls this after a payment. The request is NOT trusted: we only use the order code to find the order,
 * then ask QPay itself whether the invoice was paid in full. Safe to call repeatedly.
 */
async function handle(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  if (/^[A-Z0-9-]{4,20}$/i.test(code)) {
    const [o] = await db.select().from(schema.orders).where(eq(schema.orders.code, code.toUpperCase())).limit(1);
    if (o && o.status === "pending" && !o.isTest && o.method === "qpay" && o.providerInvoiceId) {
      const paid = await providerFor("qpay")
        .isPaid(o.providerInvoiceId, o.amountMnt)
        .catch(() => false);
      if (paid) await settleOrder(o.id);
    }
  }
  return new NextResponse("SUCCESS", { status: 200 });
}

export const GET = handle;
export const POST = handle;
