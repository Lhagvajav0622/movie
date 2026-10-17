"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db";
import { requireAdmin } from "@/server/auth";

const { packages, packageGenres } = schema;

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const form = z.object({
  id: z.string().uuid().or(z.literal("")),
  name: z.string().trim().min(1, "Багцын нэр оруулна уу").max(60),
  badge: opt(30),
  description: opt(300),
  priceMnt: z.coerce.number().int().min(0).max(100_000_000),
  oldPriceMnt: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int().min(0).max(100_000_000).nullable()),
  days: z.coerce.number().int().min(1).max(3650),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
  genreIds: z.array(z.string().uuid()).max(100),
});

const back = (kind: "msg" | "err", text: string): never =>
  redirect(`/admin/packages?${kind}=${encodeURIComponent(text)}`);

export async function savePackage(data: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const p = form.safeParse({
    id: data.get("id") ?? "",
    name: data.get("name") ?? "",
    badge: data.get("badge") ?? "",
    description: data.get("description") ?? "",
    priceMnt: data.get("priceMnt") || 0,
    oldPriceMnt: data.get("oldPriceMnt") ?? "",
    days: data.get("days") || 30,
    sortOrder: data.get("sortOrder") || 0,
    genreIds: data.getAll("genreIds").map(String),
  });
  if (!p.success) back("err", p.error.issues[0]?.message ?? "Мэдээлэл буруу байна.");
  const { id, genreIds, ...rest } = p.data!;
  const allTitles = data.get("allTitles") === "on";
  const values = {
    ...rest,
    allTitles,
    highlighted: data.get("highlighted") === "on",
    active: data.get("active") === "on",
  };
  if (values.priceMnt > 0 && !allTitles && genreIds.length === 0)
    back("err", "Ямар ангиллын кино орохыг сонгоно уу (эсвэл «Бүх кино»).");

  await db.transaction(async (tx) => {
    let pid = id;
    if (pid) await tx.update(packages).set(values).where(eq(packages.id, pid));
    else pid = (await tx.insert(packages).values(values).returning({ id: packages.id }))[0].id;
    await tx.delete(packageGenres).where(eq(packageGenres.packageId, pid));
    if (genreIds.length) await tx.insert(packageGenres).values(genreIds.map((genreId) => ({ packageId: pid, genreId })));
  });
  revalidatePath("/", "layout");
  back("msg", "Хадгаллаа.");
}

export async function deletePackage(data: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const id = z.string().uuid().safeParse(data.get("id"));
  if (!id.success) back("err", "Багц олдсонгүй.");
  await db.delete(packages).where(eq(packages.id, id.data!));
  revalidatePath("/", "layout");
  back("msg", "Багцыг устгалаа.");
}
