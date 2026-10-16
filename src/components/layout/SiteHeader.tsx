import { Header } from "./Header";
import { getNavCategories } from "@/server/categories";

/** Header with the category menu filled from the database (server side). Use this instead of <Header> directly. */
export async function SiteHeader() {
  return <Header categories={await getNavCategories()} />;
}
