import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/server/auth";

const body = z.object({ newPassword: z.string().min(8).max(128) });

/** Sets a password for an account created by OTP (which has none yet). */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "PASSWORD_TOO_SHORT" }, { status: 400 });
  }
  try {
    await auth.api.setPassword({ body: parsed.data, headers: await headers() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as { status?: number | string; body?: { code?: string } };
    const code = err.body?.code ?? "UNKNOWN";
    // Account already has a password (e.g. existing user signed in by code) → nothing to do.
    if (code.includes("ALREADY")) return NextResponse.json({ ok: true, alreadySet: true });
    const status = typeof err.status === "number" ? err.status : 400;
    return NextResponse.json({ code }, { status });
  }
}
