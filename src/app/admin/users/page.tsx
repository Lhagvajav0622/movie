import type { Metadata } from "next";

export const metadata: Metadata = { title: "Хэрэглэгчид" };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-h4 font-bold">Хэрэглэгчид</h1>
      <p className="mt-3 text-body-2 text-fg-muted">Энэ хэсэг төлбөрийн шатанд (11–12 дахь өдөр) нэмэгдэнэ.</p>
    </div>
  );
}
