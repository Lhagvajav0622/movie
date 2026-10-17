"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db";
import { requireAdmin } from "@/server/auth";

const { packages } = schema;

const form = z.object({
  genreId: z.string().uuid().or(z.literal("")),
  priceMnt: z.coerce.number().int().min(0).max(100_000_000),
  days: z.coerce.number().int().min(1).max(3650),
});

export async function savePackage(data: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const p = form.safeParse({
    genreId: data.get("genreId") ?? "",
    priceMnt: data.get("priceMnt") || 0,
    days: data.get("days") || 30,
  });
  if (!p.success) redirect(`/admin/packages?err=${encodeURIComponent("Үнэ эсвэл хоног буруу байна.")}`);
  const { genreId, priceMnt, days } = p.data;
  const where = genreId ? eq(packages.genreId, genreId) : isNull(packages.genreId);
  const [existing] = await db.select({ id: packages.id }).from(packages).where(where).limit(1);
  if (existing) await db.update(packages).set({ priceMnt, days }).where(eq(packages.id, existing.id));
  else await db.insert(packages).values({ genreId: genreId || null, priceMnt, days });
  revalidatePath("/", "layout");
  redirect(`/admin/packages?msg=${encodeURIComponent("Хадгаллаа.")}`);
}
