import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTitleForAdmin, listEpisodesAdmin, listGenres } from "@/server/catalog";
import { TitleForm } from "@/components/admin/TitleForm";
import { deleteTitle } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Бүтээл засах" };

export default async function EditTitlePage({ params, searchParams }: PageProps<"/admin/titles/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [title, genres, episodes] = await Promise.all([getTitleForAdmin(id), listGenres(), listEpisodesAdmin(id)]);
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
          Бүтээл үүслээ. Дараагийн алхам: доорх командаар ангиудаа байршуулна.
        </p>
      )}

      <TitleForm
        genres={genres}
        initial={{ ...title, type: title.type, orientation: title.orientation, status: title.status }}
      />

      <section className="mt-10 rounded-2xl border border-stroke p-5">
        <h2 className="text-body font-semibold">Ангиуд ({episodes.length})</h2>
        {episodes.length > 0 ? (
          <ul className="mt-3 divide-y divide-stroke">
            {episodes.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2 text-body-2">
                <span className="w-16 text-fg-muted">{e.number}-р анги</span>
                <span className="flex-1 text-fg-muted">{Math.round(e.durationSec / 60)} мин</span>
                <span
                  className={`rounded px-2 py-0.5 text-caption ${
                    e.status === "ready"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : e.status === "failed"
                        ? "bg-red-500/15 text-red-300"
                        : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {e.status === "ready" ? "Бэлэн" : e.status === "failed" ? "Алдаа" : "Боловсруулж байна"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-body-2 text-fg-muted">Анги алга.</p>
        )}
        <div className="mt-4 rounded-lg bg-surface p-4 text-body-2">
          <p className="font-medium">Видео байршуулах (өөрийн компьютерээс):</p>
          <p className="mt-1 text-fg-muted">Бүх ангийг нэг хавтсанд (ep1.mp4, ep2.mp4 …) хийгээд:</p>
          <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded bg-black px-3 py-2 text-caption text-brand-200">
            npm run video -- --title {title.slug} --dir &quot;C:\videos\{title.slug}&quot;
          </code>
          <p className="mt-2 text-fg-muted">Нэг анги:</p>
          <code className="mt-1 block overflow-x-auto whitespace-nowrap rounded bg-black px-3 py-2 text-caption text-brand-200">
            npm run video -- --title {title.slug} --episode 1 --file &quot;C:\videos\ep1.mp4&quot;
          </code>
        </div>
      </section>

      <form action={deleteTitle} className="mt-10 border-t border-stroke pt-6">
        <input type="hidden" name="id" value={title.id} />
        <button className="text-body-2 text-danger hover:underline">Бүтээлийг устгах</button>
        <p className="mt-1 text-caption text-fg-subtle">Худалдан авалттай бол устгахгүй, нийтлэлээс буулгана.</p>
      </form>
    </div>
  );
}
