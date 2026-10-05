import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { getOrderFor, settleOrder } from "@/server/orders";
import { paymentMode } from "@/server/payments";

type Ctx = { params: Promise<{ id: string }> };

/** TEST MODE ONLY: pretend the buyer paid. Disabled (403) when PAYMENT_MODE=live. */
export async function POST(_req: Request, { params }: Ctx) {
  if (paymentMode() !== "test") return NextResponse.json({ code: "DISABLED" }, { status: 403 });
  const { id } = await params;
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });

  const o = await getOrderFor(session.user.id, id);
  if (!o || !o.isTest) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  const settled = await settleOrder(o.id);
  return NextResponse.json({ id: o.id, status: settled?.status ?? o.status });
}
