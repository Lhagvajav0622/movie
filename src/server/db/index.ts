import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// postgres() connects lazily, so a missing URL only fails on the first query,
// not at build time.
const url = process.env.DATABASE_URL ?? "postgres://missing-database-url@localhost/none";

// Reuse one connection pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
const client = globalForDb.pg ?? postgres(url, { max: Number(process.env.DB_POOL_MAX ?? 5), prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
