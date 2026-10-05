import Link from "next/link";
import type { Metadata } from "next";
import { listGenres } from "@/server/catalog";
import { TitleForm } from "@/components/admin/TitleForm";

export const metadata: Metadata = { title: "Шинэ бүтээл" };

export default async function NewTitlePage() {
  const genres = await listGenres();
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/titles" className="text-body-2 text-fg-muted hover:text-fg">
        ← Бүтээлүүд
      </Link>
      <h1 className="mb-6 mt-2 text-h4 font-bold">Шинэ бүтээл</h1>
      <TitleForm genres={genres} />
    </div>
  );
}
