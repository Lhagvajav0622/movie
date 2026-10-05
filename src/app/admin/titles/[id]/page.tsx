import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTitleForAdmin, listGenres } from "@/server/catalog";
import { TitleForm } from "@/components/admin/TitleForm";
import { deleteTitle } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Бүтээл засах" };

export default async function EditTitlePage({ params, searchParams }: PageProps<"/admin/titles/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [title, genres] = await Promise.all([getTitleForAdmin(id), listGenres()]);
  if (!title) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/titles" className="text-body-2 text-fg-muted hover:text-fg">
        ← Бүтээлүүд
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h4 font-bold">{title.name}</h1>
        {title.status === "published" && (
          <Link href={`/title/${title.slug}`} className="text-body-2 text-brand-300 hover:underline">
            Сайт дээр харах →
          </Link>
        )}
      </div>
      {created && (
        <p className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-body-2 text-emerald-300">
          Бүтээл үүслээ. Дараагийн алхам: ангиудаа байршуулна (Bunny холбогдсоны дараа).
        </p>
      )}

      <TitleForm
        genres={genres}
        initial={{ ...title, type: title.type, orientation: title.orientation, status: title.status }}
      />

      <section className="mt-10 rounded-2xl border border-stroke p-5">
        <h2 className="text-body font-semibold">Ангиуд</h2>
        <p className="mt-2 text-body-2 text-fg-muted">
          Видео байршуулах хэсэг Bunny Stream холбогдсоны дараа энд нэмэгдэнэ.
        </p>
      </section>

      <form action={deleteTitle} className="mt-10 border-t border-stroke pt-6">
        <input type="hidden" name="id" value={title.id} />
        <button className="text-body-2 text-danger hover:underline">Бүтээлийг устгах</button>
        <p className="mt-1 text-caption text-fg-subtle">Худалдан авалттай бол устгахгүй, нийтлэлээс буулгана.</p>
      </form>
    </div>
  );
}
