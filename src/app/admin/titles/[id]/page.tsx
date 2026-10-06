import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getTitleForAdmin,
  listEpisodesAdmin,
  listGenres,
} from "@/server/catalog";
import { TitleForm } from "@/components/admin/TitleForm";
import { addEpisode, deleteEpisode, deleteTitle } from "@/app/admin/actions";
import { EpisodeUpload } from "@/components/admin/EpisodeUpload";

export const metadata: Metadata = { title: "Бүтээл засах" };

export default async function EditTitlePage({
  params,
  searchParams,
}: PageProps<"/admin/titles/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [title, genres, episodes] = await Promise.all([
    getTitleForAdmin(id),
    listGenres(),
    listEpisodesAdmin(id),
  ]);
  if (!title) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/titles"
        className="text-body-2 text-fg-muted hover:text-fg"
      >
        ← Бүтээлүүд
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h4 font-bold">{title.name}</h1>
        {title.status === "published" && (
          <Link
            href={`/title/${title.slug}`}
            className="text-body-2 text-brand-300 hover:underline"
          >
            Сайт дээр харах →
          </Link>
        )}
      </div>
      {created && (
        <p className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-body-2 text-emerald-300">
          Бүтээл үүслээ. Дараагийн алхам: доорх «Ангиуд» хэсэгт MP4 файлуудаа
          оруулна (кино бол 1-р анги дээр, цуврал бол «+ Анги нэмэх»).
        </p>
      )}

      <TitleForm
        genres={genres}
        initial={{
          ...title,
          type: title.type,
          orientation: title.orientation,
          status: title.status,
        }}
      />

      <section className="mt-10 rounded-2xl border border-stroke p-5">
        <h2 className="text-body font-semibold">Ангиуд ({episodes.length})</h2>
        <p className="mt-1 text-body-2 text-fg-muted">
          Анги бүрт хоёр тусдаа MP4 оруулна: <b>үнэгүй хэсэг</b> (хэдэн минут ч
          байж болно) болон <b>бүтэн хувилбар</b> (зөвхөн худалдаж авсан хүнд).
          Цуврал дээр үнэгүй анги байлгах бол зөвхөн «үнэгүй хэсэг» талбарт нь
          бүтэн ангиа оруулна.
        </p>
        {episodes.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-4">
            {episodes.map((e) => (
              <li key={e.id} className="rounded-xl bg-surface p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-body-2 font-semibold">
                    {e.number}-р анги
                  </span>
                  {e.hasHls && (
                    <span className="rounded bg-surface-2 px-2 py-0.5 text-caption text-fg-muted">
                      HLS (хуучин)
                    </span>
                  )}
                  <span className="flex-1" />
                  <form action={deleteEpisode}>
                    <input type="hidden" name="episodeId" value={e.id} />
                    <button className="text-caption text-danger hover:underline">
                      Устгах
                    </button>
                  </form>
                </div>
                <div className="flex flex-col gap-3 md:flex-row">
                  <EpisodeUpload
                    episodeId={e.id}
                    kind="preview"
                    label="Үнэгүй хэсэг"
                    hint="Хэн ч үзнэ. 5–10 минут эсвэл хүссэн урт."
                    uploadedMin={
                      e.previewMp4Key
                        ? Math.max(1, Math.round(e.previewDurationSec / 60))
                        : null
                    }
                  />
                  <EpisodeUpload
                    episodeId={e.id}
                    kind="full"
                    label="Бүтэн хувилбар"
                    hint="Зөвхөн худалдаж авсан хүнд."
                    uploadedMin={
                      e.fullMp4Key
                        ? Math.max(1, Math.round(e.durationSec / 60))
                        : null
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-body-2 text-fg-muted">
            Анги алга. Доорх товчоор анги нэм.
          </p>
        )}
        <form action={addEpisode} className="mt-4">
          <input type="hidden" name="titleId" value={title.id} />
          <button className="rounded-lg border border-brand-300 bg-brand-500 px-4 py-2 text-body-2 font-semibold hover:bg-brand-400">
            + Анги нэмэх
          </button>
        </form>
        <details className="mt-5 rounded-lg bg-surface p-4 text-body-2">
          <summary className="cursor-pointer font-medium">
            Нарийн сонголт: компьютер дээрээс HLS (хуучин арга)
          </summary>
          <p className="mt-2 text-fg-muted">
            Бүх ангийг нэг хавтсанд (ep1.mp4, ep2.mp4 …) хийгээд:
          </p>
          <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded bg-black px-3 py-2 text-caption text-brand-200">
            npm run video -- --title {title.slug} --dir &quot;C:\videos\
            {title.slug}&quot;
          </code>
          <p className="mt-2 text-fg-muted">
            Энэ аргаар оруулсан видеонд «Үнэгүй үзэх минут» (дээрх маягт)
            хамаарна.
          </p>
        </details>
      </section>

      <form action={deleteTitle} className="mt-10 border-t border-stroke pt-6">
        <input type="hidden" name="id" value={title.id} />
        <button className="text-body-2 text-danger hover:underline">
          Бүтээлийг устгах
        </button>
        <p className="mt-1 text-caption text-fg-subtle">
          Худалдан авалттай бол устгахгүй, нийтлэлээс буулгана.
        </p>
      </form>
    </div>
  );
}
