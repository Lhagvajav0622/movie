import type { Metadata } from "next";
import { EmptyState as Empty } from "@/components/catalog/EmptyState";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { listSaved } from "@/server/library";
import { BackBar } from "@/components/catalog/DetailChrome";
import { MediaListItem, typeLabel } from "@/components/catalog/MediaListItem";

export const metadata: Metadata = { title: "Хадгалсан" };

export default async function SavedPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/saved");
  const rows = await listSaved(session.user.id);

  return (
    <div className="mx-auto max-w-[720px] md:px-4 md:pt-6">
      <BackBar title="Хадгалсан" />
      <h1 className="mb-6 hidden text-[28px] font-bold leading-9 md:block">Хадгалсан</h1>
      {rows.length ? (
        <ul className="flex flex-col gap-4 px-4 md:px-0">
          {rows.map((t) => (
            <MediaListItem
              key={t.id}
              href={`/title/${t.slug}`}
              t={t}
              meta={[t.year, typeLabel(t.type)].filter(Boolean).join(" • ")}
            />
          ))}
        </ul>
      ) : (
        <Empty text="Хадгалсан бүтээл алга." hint="Киноны хуудсан дээрх «Хадгалах» товчийг дараарай." />
      )}
    </div>
  );
}
