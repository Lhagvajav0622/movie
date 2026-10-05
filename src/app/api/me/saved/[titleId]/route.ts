import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getSession } from "@/server/auth";

type Ctx = { params: Promise<{ titleId: string }> };
const uuid = /^[0-9a-f-]{36}$/;

export async function PUT(_req: Request, { params }: Ctx) {
  const s = await getSession();
  if (!s) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  const { titleId } = await params;
  if (!uuid.test(titleId)) return NextResponse.json({ code: "BAD_ID" }, { status: 400 });
  await db.insert(schema.savedTitles).values({ userId: s.user.id, titleId }).onConflictDoNothing();
  return NextResponse.json({ saved: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const s = await getSession();
  if (!s) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  const { titleId } = await params;
  if (!uuid.test(titleId)) return NextResponse.json({ code: "BAD_ID" }, { status: 400 });
  await db
    .delete(schema.savedTitles)
    .where(and(eq(schema.savedTitles.userId, s.user.id), eq(schema.savedTitles.titleId, titleId)));
  return NextResponse.json({ saved: false });
}
