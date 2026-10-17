import "server-only";
import { after } from "next/server";
import { sendViaCallPro, type SmsResult } from "./sms-callpro";

/**
 * SMS sending.
 *  - SMS_PROVIDER=callpro + SMS_API_KEY + SMS_SENDER: CallPro Text (SMS_API_URL optionally overrides the base URL).
 *  - SMS_API_URL only: a generic JSON gateway (Bearer key) for other providers.
 *  - Nothing set (local dev, demo): the message is printed to the server log.
 * Keys are read from the environment only (Vercel settings), never from code.
 */
type Provider = "callpro" | "generic" | null;

function provider(): Provider {
  if (process.env.SMS_PROVIDER === "callpro" && process.env.SMS_API_KEY && process.env.SMS_SENDER)
    return "callpro";
  if (process.env.SMS_API_URL) return "generic";
  return null;
}

/** True once a real SMS gateway is configured (OTP codes are then no longer shown on screen). */
export const smsConfigured = () => provider() !== null;

const mask = (phone: string) => `***${phone.replace(/\D/g, "").slice(-4)}`;

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const p = provider();
  if (p === "callpro") {
    const r = await sendViaCallPro(
      {
        apiKey: process.env.SMS_API_KEY!,
        from: process.env.SMS_SENDER!,
        baseUrl: process.env.SMS_API_URL || undefined,
      },
      to,
      body,
    );
    if (!r.ok) console.error(`[sms] callpro failed status=${r.status} error="${r.error}" to=${mask(to)}`);
    return r;
  }
  if (p === "generic") {
    try {
      const res = await fetch(process.env.SMS_API_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SMS_API_KEY ?? ""}`,
        },
        body: JSON.stringify({ from: process.env.SMS_SENDER, to, text: body }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) console.error(`[sms] failed status=${res.status} to=${mask(to)}`);
      return { ok: res.ok, status: res.status };
    } catch (e) {
      console.error(`[sms] failed to=${mask(to)}`, e);
      return { ok: false, status: 0 };
    }
  }
  console.log(`[sms:dev] to=${to} body="${body}"`);
  return { ok: true, status: 0 };
}

/**
 * Sends after the HTTP response has gone out (so the login form is not slowed down and the response time
 * does not reveal whether a number exists). On serverless the work would be cut off if it were just
 * "fire and forget", so it is registered with after(), with a plain fallback outside a request.
 */
export function sendSmsAfterResponse(to: string, body: string): void {
  const run = () => sendSms(to, body).then(() => undefined);
  try {
    after(run);
  } catch {
    void run();
  }
}

/** Normalises Mongolian mobile numbers to +976XXXXXXXX, or returns null. */
export function normalizeMnPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^976/, "");
  return /^[6-9]\d{7}$/.test(digits) ? `+976${digits}` : null;
}
