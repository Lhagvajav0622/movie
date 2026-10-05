import "server-only";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { db, schema } from "./db";

const PER_MINUTE = 1;
const PER_HOUR = 5;

/**
 * Per-phone SMS throttle. Returns null when sending is allowed (and records the send),
 * or the number of seconds to wait.
 * Per-IP limits alone are not enough: Mongolian mobile carriers put many users behind one IP.
 */
export async function reserveOtpSend(phone: string): Promise<number | null> {
  const now = Date.now();
  const minuteAgo = new Date(now - 60_000);
  const hourAgo = new Date(now - 3_600_000);

  const [{ n: lastMinute }] = await db
    .select({ n: count() })
    .from(schema.otpSends)
    .where(and(eq(schema.otpSends.phone, phone), gt(schema.otpSends.createdAt, minuteAgo)));
  if (lastMinute >= PER_MINUTE) return 60;

  const [{ n: lastHour }] = await db
    .select({ n: count() })
    .from(schema.otpSends)
    .where(and(eq(schema.otpSends.phone, phone), gt(schema.otpSends.createdAt, hourAgo)));
  if (lastHour >= PER_HOUR) return 3600;

  await db.insert(schema.otpSends).values({ phone });
  // Housekeeping: drop rows older than a day (cheap, indexed).
  void db.delete(schema.otpSends).where(lt(schema.otpSends.createdAt, new Date(now - 86_400_000)));
  return null;
}
