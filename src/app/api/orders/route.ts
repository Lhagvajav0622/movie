import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth";
import { createOrder } from "@/server/orders";
import { paymentMode } from "@/server/payments";

const body = z.object({ titleId: z.string().uuid(), method: z.enum(["qpay", "socialpay"]) });

/** Start a purchase. The price comes from the DB, never from the request. */
export async function POST(req: Request) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "BAD_REQUEST" }, { status: 400 });

  const r = await createOrder(session.user.id, parsed.data.titleId, parsed.data.method);
  if (!r.ok) {
    const status = r.code === "NOT_FOUND" ? 404 : r.code === "PROVIDER_ERROR" ? 502 : 409;
    return NextResponse.json({ code: r.code }, { status });
  }
  const { id, code, amountMnt, method, status } = r.order;
  return NextResponse.json({ id, code, amountMnt, method, status, mode: paymentMode() });
}
