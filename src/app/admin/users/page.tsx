import Link from "next/link";
import type { Metadata } from "next";
import { listUsersAdmin } from "@/server/grants";
import { proActive, proDaysLeft } from "@/lib/pro";

export const metadata: Metadata = { title: "Хэрэглэгчид" };

export default async function Page({
  searchParams,
}: PageProps<"/admin/users">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rows = await listUsersAdmin(q);
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-h4 font-bold">Хэрэглэгчид</h1>
      <p className="mt-2 text-body-2 text-fg-muted">
        Бүртгэлтэй хэрэглэгчид ({rows.length}). Хэрэглэгч дээр дарж аль киног
        үзэх эрх өгөх, эсвэл бүх киног үзэх «Pro» эрх өгнө.
      </p>
      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Утасны дугаар эсвэл нэрээр хайх"
          className="h-11 w-full max-w-sm rounded-lg border border-stroke bg-surface px-3 text-body-2 outline-none focus:border-brand-400"
        />
        <button className="h-11 rounded-lg bg-brand-500 px-5 text-body-2 font-semibold hover:bg-brand-400">
          Хайх
        </button>
      </form>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-stroke">
        <table className="w-full text-left text-body-2">
          <thead className="bg-surface text-fg-muted">
            <tr>
              <th className="px-4 py-3">Утас</th>
              <th className="px-4 py-3">Нэр</th>
              <th className="px-4 py-3">Авсан кино</th>
              <th className="px-4 py-3">Pro</th>
              <th className="px-4 py-3">Бүртгүүлсэн</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke">
            {rows.map((u) => {
              const active =
                u.hasPro && proActive({ expiresAt: u.proExpiresAt });
              const left = proDaysLeft(u.proExpiresAt);
              return (
                <tr key={u.id} className="hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-medium text-brand-300 hover:underline"
                    >
                      {u.phone ?? "—"}
                    </Link>
                    {u.role === "admin" && (
                      <span className="ml-2 rounded bg-brand-500/20 px-1.5 py-0.5 text-caption">
                        админ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.bought}</td>
                  <td className="px-4 py-3">
                    {active ? (
                      <span className="text-emerald-300">
                        {left === null ? "Хугацаагүй" : `${left} хоног үлдсэн`}
                      </span>
                    ) : u.hasPro ? (
                      <span className="text-fg-subtle">Дууссан</span>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {u.createdAt.toLocaleDateString("mn-MN")}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-fg-muted">
                  Хэрэглэгч олдсонгүй.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
