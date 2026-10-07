import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listAllTitlesAdmin } from "@/server/catalog";
import { getUserAdmin } from "@/server/grants";
import { proActive, proDaysLeft } from "@/lib/pro";
import {
  grantTitleAction,
  revokeProAction,
  revokeTitleAction,
  setProAction,
} from "../actions";

export const metadata: Metadata = { title: "Хэрэглэгч" };

const btn = "h-10 rounded-lg px-4 text-body-2 font-semibold";

export default async function Page({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const data = await getUserAdmin(id);
  if (!data) notFound();
  const { user, owned, pro, orders } = data;
  const titles = await listAllTitlesAdmin();
  const ownedIds = new Set(owned.map((o) => o.titleId));
  const available = titles.filter((t) => !ownedIds.has(t.id));
  const active = proActive(pro);
  const left = proDaysLeft(pro?.expiresAt ?? null);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/users"
        className="text-body-2 text-fg-muted hover:text-fg"
      >
        ← Хэрэглэгчид
      </Link>
      <h1 className="mb-1 mt-2 text-h4 font-bold">
        {user.phoneNumber ?? user.name}
      </h1>
      <p className="text-body-2 text-fg-muted">
        {user.name} · бүртгүүлсэн {user.createdAt.toLocaleDateString("mn-MN")}
      </p>

      <section className="mt-6 rounded-2xl border border-stroke p-5">
        <h2 className="text-body font-semibold">Pro эрх (бүх киног үзэх)</h2>
        <p className="mt-1 text-body-2">
          {active ? (
            <span className="text-emerald-300">
              Идэвхтэй ·{" "}
              {left === null
                ? "хугацаагүй"
                : `${left} хоног үлдсэн (${pro!.expiresAt!.toLocaleDateString("mn-MN")} хүртэл)`}
            </span>
          ) : pro ? (
            <span className="text-fg-subtle">Хугацаа дууссан</span>
          ) : (
            <span className="text-fg-subtle">Байхгүй</span>
          )}
        </p>
        <form
          action={setProAction}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="userId" value={user.id} />
          <select
            name="days"
            defaultValue="30"
            className="h-10 rounded-lg border border-stroke bg-surface px-3 text-body-2"
          >
            <option value="7">7 хоног</option>
            <option value="30">30 хоног</option>
            <option value="90">90 хоног</option>
            <option value="365">365 хоног</option>
            <option value="forever">Хугацаагүй</option>
          </select>
          <button className={`${btn} bg-brand-500 hover:bg-brand-400`}>
            {pro ? "Шинэчлэх" : "Pro эрх өгөх"}
          </button>
        </form>
        {pro && (
          <form action={revokeProAction} className="mt-2">
            <input type="hidden" name="userId" value={user.id} />
            <button className="text-body-2 text-red-400 hover:underline">
              Pro эрхийг цуцлах
            </button>
          </form>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-stroke p-5">
        <h2 className="text-body font-semibold">
          Үзэх эрхтэй кинонууд ({owned.length})
        </h2>
        <ul className="mt-3 divide-y divide-stroke">
          {owned.map((o) => (
            <li
              key={o.titleId}
              className="flex items-center justify-between gap-3 py-2 text-body-2"
            >
              <span>
                {o.name}{" "}
                <span className="text-fg-subtle">
                  · {o.source === "admin" ? "админ өгсөн" : "худалдаж авсан"} ·{" "}
                  {o.createdAt.toLocaleDateString("mn-MN")}
                </span>
              </span>
              <form action={revokeTitleAction}>
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="titleId" value={o.titleId} />
                <button className="text-red-400 hover:underline">Цуцлах</button>
              </form>
            </li>
          ))}
          {owned.length === 0 && (
            <li className="py-2 text-body-2 text-fg-subtle">
              Одоогоор байхгүй.
            </li>
          )}
        </ul>
        {available.length > 0 && (
          <form
            action={grantTitleAction}
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="userId" value={user.id} />
            <select
              name="titleId"
              className="h-10 min-w-0 flex-1 rounded-lg border border-stroke bg-surface px-3 text-body-2"
            >
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button className={`${btn} bg-brand-500 hover:bg-brand-400`}>
              Үзэх эрх өгөх
            </button>
          </form>
        )}
      </section>

      {orders.length > 0 && (
        <section className="mt-6 rounded-2xl border border-stroke p-5">
          <h2 className="text-body font-semibold">Захиалгууд</h2>
          <ul className="mt-3 divide-y divide-stroke text-body-2">
            {orders.map((o, i) => (
              <li key={i} className="flex justify-between py-2">
                <span>
                  {o.amountMnt.toLocaleString("mn-MN")}₮ · {o.status}
                  {o.isTest && " · тест"}
                </span>
                <span className="text-fg-subtle">
                  {o.createdAt.toLocaleString("mn-MN")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
