import type { Metadata } from "next";
import { listOrdersAdmin } from "@/server/orders";
import { paymentMode } from "@/server/payments";

export const metadata: Metadata = { title: "Захиалга" };

const STATUS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  awaiting_review: "Шалгагдаж буй",
  paid: "Төлөгдсөн",
  rejected: "Татгалзсан",
  expired: "Хугацаа дууссан",
};

export default async function Page() {
  const rows = await listOrdersAdmin();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-h4 font-bold">Захиалга</h1>
      <p className="mt-2 text-body-2 text-fg-muted">
        Төлбөрийн горим: <b>{paymentMode() === "test" ? "ТЕСТ (бодит төлбөр хийгдэхгүй)" : "LIVE"}</b>
      </p>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-stroke">
        <table className="w-full text-left text-body-2">
          <thead className="bg-surface text-fg-muted">
            <tr>
              <th className="px-4 py-3">Код</th>
              <th className="px-4 py-3">Хэрэглэгч</th>
              <th className="px-4 py-3">Бүтээл</th>
              <th className="px-4 py-3">Дүн</th>
              <th className="px-4 py-3">Төрөл</th>
              <th className="px-4 py-3">Төлөв</th>
              <th className="px-4 py-3">Огноо</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke">
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-mono">{o.code}</td>
                <td className="px-4 py-3">{o.userPhone ?? o.userName}</td>
                <td className="px-4 py-3">{o.titleName}</td>
                <td className="px-4 py-3">{o.amountMnt.toLocaleString("mn-MN")}₮</td>
                <td className="px-4 py-3">
                  {o.method === "socialpay" ? "SocialPay" : "QPay"}
                  {o.isTest && <span className="ml-1 rounded bg-brand-500/20 px-1.5 py-0.5 text-caption">тест</span>}
                </td>
                <td className="px-4 py-3">{STATUS[o.status] ?? o.status}</td>
                <td className="px-4 py-3 text-fg-muted">{o.createdAt.toLocaleString("mn-MN")}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-fg-muted">
                  Захиалга алга.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
