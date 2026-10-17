/**
 * CallPro Text REST API (https://api-text.callpro.mn/v1/sms). Pure helpers, no secrets read here.
 * Auth: header `x-api-key`. Send: POST /send with { from, to, text }. Success 200 { status: "queued", message_id }.
 * Errors: 400 bad parameter, 401 bad key, 402 not paid, 403 blocked number, 404, 422 { issues }, 500.
 * Cyrillic text is 70 characters per SMS segment (Latin 160), so keep OTP texts short.
 */

export const CALLPRO_BASE_URL = "https://api-text.callpro.mn/v1/sms";

export type CallProConfig = {
  apiKey: string;
  /** The line number CallPro assigned (e.g. 72xxxxxx). There is no sender name, only this number. */
  from: string;
  baseUrl?: string;
};

export type SmsResult = { ok: boolean; status: number; messageId?: string; error?: string };

/** CallPro takes the 8-digit local number (+976 / 976 prefixes also work, but 8 digits is the documented form). */
export function toLocalNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("976") ? digits.slice(3) : digits;
}

export const otpMessage = (code: string) => `Кино Хором: баталгаажуулах код ${code}`;
export const resetMessage = (code: string) => `Кино Хором: нууц үг сэргээх код ${code}`;

export function callProRequest(cfg: CallProConfig, to: string, text: string) {
  const base = (cfg.baseUrl || CALLPRO_BASE_URL).replace(/\/+$/, "");
  return {
    url: `${base}/send`,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": cfg.apiKey },
      body: JSON.stringify({ from: cfg.from, to: toLocalNumber(to), text }),
    } satisfies RequestInit,
  };
}

/** Sends one SMS. Never throws; the caller decides what a failure means. */
export async function sendViaCallPro(
  cfg: CallProConfig,
  to: string,
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SmsResult> {
  const { url, init } = callProRequest(cfg, to, text);
  try {
    const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(8000) });
    const body = (await res.json().catch(() => null)) as {
      message_id?: string;
      error?: string;
    } | null;
    if (res.ok) return { ok: true, status: res.status, messageId: body?.message_id };
    return { ok: false, status: res.status, error: body?.error ?? "request failed" };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "network error" };
  }
}
