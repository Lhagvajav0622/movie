import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { listSaved } from "@/server/library";
import { BackBar } from "@/components/catalog/DetailChrome";
import { SavedList } from "@/components/catalog/SavedList";

export const metadata: Metadata = { title: "Хадгалсан" };

export default async function SavedPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/saved");
  const rows = await listSaved(session.user.id);

  return (
    <div className="mx-auto max-w-[720px] md:px-4 md:pt-6">
      <BackBar title="Хадгалсан" />
      <h1 className="mb-6 hidden text-[28px] font-bold leading-9 md:block">
        Хадгалсан
      </h1>
      <SavedList rows={rows} />
    </div>
  );
}
