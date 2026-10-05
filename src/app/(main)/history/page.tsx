import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { listHistory } from "@/server/library";
import { BackBar } from "@/components/catalog/DetailChrome";
import { MediaListItem, typeLabel } from "@/components/catalog/MediaListItem";
import { EmptyState as Empty } from "@/components/catalog/EmptyState";

export const metadata: Metadata = { title: "Үзсэн түүх" };

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/history");
  const rows = await listHistory(session.user.id);

  return (
    <div className="mx-auto max-w-[720px] md:px-4 md:pt-6">
      <BackBar title="Үзсэн түүх" />
      <h1 className="mb-6 hidden text-[28px] font-bold leading-9 md:block">Үзсэн түүх</h1>
      {rows.length ? (
        <ul className="flex flex-col gap-4 px-4 md:px-0">
          {rows.map((t) => (
            <MediaListItem
              key={t.id}
              href={`/watch/${t.slug}/${t.episodeNumber}`}
              t={t}
              meta={[t.year, t.type === "series" ? `${t.episodeNumber}-р анги` : typeLabel(t.type)].filter(Boolean).join(" • ")}
              progress={t.durationSec ? t.positionSec / t.durationSec : undefined}
            />
          ))}
        </ul>
      ) : (
        <Empty text="Үзсэн түүх хоосон байна." hint="Үзсэн кино, ангиуд энд харагдана." />
      )}
    </div>
  );
}
