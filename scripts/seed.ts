/**
 * Seeds genres. Usage: npm run db:seed
 * Promote an admin after they have signed up once:
 *   npm run db:seed -- --admin +97699112233
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/server/db/schema";

const genres = [
  ["Драм", "drama"],
  ["Романс", "romance"],
  ["Инээдмийн", "comedy"],
  ["Тулаант", "action"],
  ["Аймшгийн", "horror"],
  ["Түүхэн", "historical"],
  ["Гэр бүл", "family"],
  ["Анимэйшн", "animation"],
  ["+18", "adult"],
] as const;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[seed] DATABASE_URL not set, skipping");
    return;
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  await db
    .insert(schema.genres)
    .values(genres.map(([nameMn, slug], i) => ({ nameMn, slug, sortOrder: i })))
    .onConflictDoNothing();
  console.log(`genres: ${genres.length}`);

  const adminIdx = process.argv.indexOf("--admin");
  if (adminIdx > -1) {
    const phone = process.argv[adminIdx + 1];
    const res = await db
      .update(schema.user)
      .set({ role: "admin" })
      .where(eq(schema.user.phoneNumber, phone))
      .returning({ id: schema.user.id });
    console.log(res.length ? `admin: ${phone}` : `no user with phone ${phone}`);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
