import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { getOrderFor, settleOrder } from "@/server/orders";
import { providerFor } from "@/server/payments";

type Ctx = { params: Promise<{ id: string }> };

/** Order status (polled by the checkout screen). For live providers this asks QPay/SocialPay. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });

  let o = await getOrderFor(session.user.id, id);
  if (!o) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });

  if (o.status === "pending" && !o.isTest && o.providerInvoiceId) {
    const paid = await providerFor(o.method === "socialpay" ? "socialpay" : "qpay")
      .isPaid(o.providerInvoiceId)
      .catch(() => false);
    if (paid) o = (await settleOrder(o.id)) ?? o;
  }
  return NextResponse.json({ id: o.id, status: o.status }, { headers: { "Cache-Control": "private, no-store" } });
}
