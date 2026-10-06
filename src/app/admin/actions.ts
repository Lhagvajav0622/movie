"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { slugTaken } from "@/server/catalog";
import { slugify } from "@/lib/slug";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v));
const optionalInt = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .pipe(z.number().int().min(0).nullable());

const titleSchema = z.object({
  name: z.string().trim().min(1, "Нэр оруулна уу"),
  slug: z.string().trim(),
  nameOriginal: optionalText,
  description: optionalText,
  type: z.enum(["film", "series"]),
  orientation: z.enum(["vertical", "horizontal"]),
  year: optionalInt,
  ageRating: optionalText,
  country: optionalText,
  director: optionalText,
  castText: optionalText,
  posterUrl: optionalText.pipe(z.string().url("Постерын холбоос буруу").nullable()),
  backdropUrl: optionalText.pipe(z.string().url("Арын зургийн холбоос буруу").nullable()),
  priceMnt: z.coerce.number().int().min(0, "Үнэ сөрөг байж болохгүй"),
  freePreviewMin: z.coerce.number().min(0).max(600),
  isFeatured: z.boolean(),
  status: z.enum(["draft", "published"]),
  genreIds: z.array(z.string().uuid()),
});

export type TitleFormState = { error?: string; ok?: boolean } | undefined;

export async function saveTitle(_prev: TitleFormState, form: FormData): Promise<TitleFormState> {
  if (!(await requireAdmin())) return { error: "Админ эрх шаардлагатай." };

  const id = String(form.get("id") ?? "") || null;
  const parsed = titleSchema.safeParse({
    name: form.get("name") ?? "",
    slug: form.get("slug") ?? "",
    nameOriginal: form.get("nameOriginal") ?? "",
    description: form.get("description") ?? "",
    type: form.get("type"),
    orientation: form.get("orientation"),
    year: form.get("year") ?? "",
    ageRating: form.get("ageRating") ?? "",
    country: form.get("country") ?? "",
    director: form.get("director") ?? "",
    castText: form.get("castText") ?? "",
    posterUrl: form.get("posterUrl") ?? "",
    backdropUrl: form.get("backdropUrl") ?? "",
    priceMnt: form.get("priceMnt") ?? "0",
    freePreviewMin: form.get("freePreviewMin") ?? "5",
    isFeatured: form.get("isFeatured") === "on",
    status: form.get("status") === "published" ? "published" : "draft",
    genreIds: form.getAll("genreIds").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу байна." };

  const d = parsed.data;
  const slug = slugify(d.slug || d.name) || `title-${Date.now()}`;
  if (await slugTaken(slug, id ?? undefined)) return { error: `"${slug}" хаяг өөр бүтээлд ашиглагдсан байна.` };

  const values = {
    slug,
    name: d.name,
    nameOriginal: d.nameOriginal,
    searchText: `${d.name} ${d.nameOriginal ?? ""}`.toLocaleLowerCase("mn").trim(),
    description: d.description,
    type: d.type,
    orientation: d.orientation,
    year: d.year,
    ageRating: d.ageRating,
    country: d.country,
    director: d.director,
    castText: d.castText,
    posterUrl: d.posterUrl,
    backdropUrl: d.backdropUrl,
    priceMnt: d.priceMnt,
    freePreviewSec: Math.round(d.freePreviewMin * 60),
    isFeatured: d.isFeatured,
    status: d.status,
    updatedAt: new Date(),
  };

  let titleId = id;
  await db.transaction(async (tx) => {
    if (titleId) {
      const [prev] = await tx
        .select({ publishedAt: schema.titles.publishedAt })
        .from(schema.titles)
        .where(eq(schema.titles.id, titleId));
      await tx
        .update(schema.titles)
        .set({ ...values, publishedAt: d.status === "published" ? (prev?.publishedAt ?? new Date()) : prev?.publishedAt })
        .where(eq(schema.titles.id, titleId));
    } else {
      const [row] = await tx
        .insert(schema.titles)
        .values({ ...values, publishedAt: d.status === "published" ? new Date() : null })
        .returning({ id: schema.titles.id });
      titleId = row.id;
    }
    await tx.delete(schema.titleGenres).where(eq(schema.titleGenres.titleId, titleId!));
    if (d.genreIds.length) {
      await tx.insert(schema.titleGenres).values(d.genreIds.map((genreId) => ({ titleId: titleId!, genreId })));
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/titles");
  if (!id) redirect(`/admin/titles/${titleId}?created=1`);
  return { ok: true };
}

export async function deleteTitle(form: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const id = String(form.get("id"));
  const [hasOrders] = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(eq(schema.orders.titleId, id))
    .limit(1);
  if (hasOrders) {
    // Keep sales history intact: unpublish instead of deleting.
    await db.update(schema.titles).set({ status: "draft", updatedAt: new Date() }).where(eq(schema.titles.id, id));
  } else {
    await db.delete(schema.titles).where(eq(schema.titles.id, id));
  }
  revalidatePath("/");
  revalidatePath("/admin/titles");
  redirect("/admin/titles");
}

/** Adds the next empty episode to a title (video files are attached next, from the browser). */
export async function addEpisode(form: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const titleId = String(form.get("titleId"));
  const [last] = await db
    .select({ n: sql<number>`coalesce(max(${schema.episodes.number}), 0)::int` })
    .from(schema.episodes)
    .where(eq(schema.episodes.titleId, titleId));
  await db.insert(schema.episodes).values({ titleId, number: (last?.n ?? 0) + 1, status: "processing" });
  revalidatePath(`/admin/titles/${titleId}`);
}

export async function deleteEpisode(form: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const id = String(form.get("episodeId"));
  const [ep] = await db.select().from(schema.episodes).where(eq(schema.episodes.id, id)).limit(1);
  if (!ep) return;
  await db.delete(schema.episodes).where(eq(schema.episodes.id, id));
  const { deleteObjects, imageStorageConfigured } = await import("@/server/storage");
  const { mp4Keys } = await import("@/server/video");
  if (imageStorageConfigured()) await deleteObjects([mp4Keys(id).full.key, mp4Keys(id).preview.key]);
  revalidatePath(`/admin/titles/${ep.titleId}`);
  revalidatePath("/");
}
