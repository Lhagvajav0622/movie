import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/server/auth";
import { getTitleDetail } from "@/server/title";
import { ReelFeed } from "@/components/player/ReelFeed";
import { FilmPlayer } from "@/components/player/FilmPlayer";
import { Header } from "@/components/layout/Header";

export async function generateMetadata({ params }: PageProps<"/watch/[slug]/[ep]">): Promise<Metadata> {
  const { slug, ep } = await params;
  const t = await getTitleDetail(slug).catch(() => null);
  return { title: t ? `${t.name} · ${ep}-р анги` : "Үзэх", robots: { index: false } };
}

export default async function WatchPage({ params }: PageProps<"/watch/[slug]/[ep]">) {
  const { slug, ep } = await params;
  const session = await getSession().catch(() => null);
  const t = await getTitleDetail(slug, session?.user.id);
  if (!t) notFound();
  if (!t.episodes.length) notFound();

  const number = Number(ep) || t.episodes[0].number;
  const current = t.episodes.find((e) => e.number === number) ?? t.episodes[0];

  if (t.orientation === "vertical") {
    return (
      <ReelFeed
        titleId={t.id}
        slug={t.slug}
        titleName={t.name}
        episodes={t.episodes}
        startNumber={current.number}
        priceMnt={t.priceMnt}
      />
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-16">
        <FilmPlayer
          titleId={t.id}
          slug={t.slug}
          titleName={t.name}
          episodes={t.episodes}
          current={current}
          priceMnt={t.priceMnt}
            hue={t.hue}
        />
      </main>
    </>
  );
}
