"use server";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { ADULT_SLUG } from "@/server/categories";
import { moveId } from "@/lib/reorder";
import { slugify } from "@/lib/slug";

const { genres } = schema;

const nameSchema = z
  .string()
  .trim()
  .min(1, "Ангиллын нэр оруулна уу")
  .max(40, "Нэр 40 тэмдэгтээс хэтрэхгүй байх ёстой");
const idSchema = z.string().uuid();

function done(msg: string): never {
  revalidatePath("/", "layout");
  updateTag("catalog");
  redirect(`/admin/categories?msg=${encodeURIComponent(msg)}`);
}

function fail(msg: string): never {
  redirect(`/admin/categories?err=${encodeURIComponent(msg)}`);
}

async function nameTaken(name: string, exceptId?: string) {
  // ilike treats % and _ as wildcards, so escape them for an exact (case-insensitive) match.
  const exact = name.replace(/[\\%_]/g, (c) => `\\${c}`);
  const rows = await db
    .select({ id: genres.id })
    .from(genres)
    .where(ilike(genres.nameMn, exact));
  return rows.some((r) => r.id !== exceptId);
}

export async function addCategory(form: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const parsed = nameSchema.safeParse(form.get("name") ?? "");
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Нэр буруу байна.");
  const name = parsed.data;
  if (await nameTaken(name)) fail(`"${name}" ангилал аль хэдийн байна.`);

  const base = slugify(name) || `cat-${Date.now().toString(36)}`;
  let slug = base === ADULT_SLUG ? `${base}-2` : base;
  for (let i = 2; ; i++) {
    const [hit] = await db
      .select({ id: genres.id })
      .from(genres)
      .where(eq(genres.slug, slug))
      .limit(1);
    if (!hit) break;
    slug = `${base}-${i}`;
  }

  const [last] = await db
    .select({ n: sql<number>`coalesce(max(${genres.sortOrder}), -1)::int` })
    .from(genres);
  await db.insert(genres).values({ nameMn: name, slug, sortOrder: (last?.n ?? -1) + 1 });
  done(`"${name}" ангилал нэмэгдлээ.`);
}

export async function renameCategory(form: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const id = idSchema.safeParse(form.get("id"));
  const name = nameSchema.safeParse(form.get("name") ?? "");
  if (!id.success) fail("Ангилал олдсонгүй.");
  if (!name.success) fail(name.error.issues[0]?.message ?? "Нэр буруу байна.");

  const [row] = await db.select().from(genres).where(eq(genres.id, id.data)).limit(1);
  if (!row) fail("Ангилал олдсонгүй.");
  if (row.slug === ADULT_SLUG) fail("+18 ангиллын нэрийг өөрчлөх боломжгүй.");
  if (row.nameMn === name.data) done("Өөрчлөлт алга.");
  if (await nameTaken(name.data, row.id)) fail(`"${name.data}" ангилал аль хэдийн байна.`);

  await db.update(genres).set({ nameMn: name.data }).where(eq(genres.id, row.id));
  done("Нэр шинэчлэгдлээ.");
}

export async function moveCategory(form: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const id = idSchema.safeParse(form.get("id"));
  const dir = form.get("dir") === "up" ? "up" : "down";
  if (!id.success) fail("Ангилал олдсонгүй.");

  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: genres.id })
      .from(genres)
      .orderBy(asc(genres.sortOrder), asc(genres.nameMn));
    const next = moveId(
      rows.map((r) => r.id),
      id.data,
      dir,
    );
    // Rewrite every position so ties and gaps never leave the order ambiguous.
    for (const [i, gid] of next.entries()) {
      await tx.update(genres).set({ sortOrder: i }).where(eq(genres.id, gid));
    }
  });
  done("Дараалал шинэчлэгдлээ.");
}

export async function deleteCategory(form: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const id = idSchema.safeParse(form.get("id"));
  if (!id.success) fail("Ангилал олдсонгүй.");
  const [row] = await db.select().from(genres).where(eq(genres.id, id.data)).limit(1);
  if (!row) fail("Ангилал олдсонгүй.");
  if (row.slug === ADULT_SLUG) fail("+18 ангиллыг устгах боломжгүй.");

  // Titles stay; only their link to this category is removed (title_genres cascades).
  await db.delete(genres).where(eq(genres.id, row.id));
  done(`"${row.nameMn}" ангилал устгагдлаа.`);
}
