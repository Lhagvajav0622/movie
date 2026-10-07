"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { grantTitle, revokePro, revokeTitle, setPro } from "@/server/grants";

async function guard(form: FormData) {
  if (!(await requireAdmin())) throw new Error("Unauthorized");
  const userId = String(form.get("userId") ?? "");
  if (!userId) throw new Error("userId");
  return userId;
}
const done = (userId: string) => {
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
};

export async function grantTitleAction(form: FormData) {
  const userId = await guard(form);
  const titleId = String(form.get("titleId") ?? "");
  if (titleId) await grantTitle(userId, titleId);
  done(userId);
}

export async function revokeTitleAction(form: FormData) {
  const userId = await guard(form);
  await revokeTitle(userId, String(form.get("titleId") ?? ""));
  done(userId);
}

export async function setProAction(form: FormData) {
  const userId = await guard(form);
  const v = String(form.get("days") ?? "");
  const days = v === "forever" ? null : Number(v);
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 3650))
    return;
  await setPro(userId, days);
  done(userId);
}

export async function revokeProAction(form: FormData) {
  const userId = await guard(form);
  await revokePro(userId);
  done(userId);
}
