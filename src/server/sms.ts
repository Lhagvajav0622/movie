import "server-only";

/**
 * Sends an SMS through the Mongolian gateway once SMS_API_URL is configured.
 * Until then (local dev, demo on Vercel) the message is printed to the server log
 * so OTP codes can be read from the terminal / Vercel logs.
 */
export async function sendSms(to: string, body: string): Promise<void> {
  const url = process.env.SMS_API_URL;
  if (!url) {
    console.log(`[sms:dev] to=${to} body="${body}"`);
    return;
  }
  // Generic JSON POST; adjust field names to the chosen provider's API.
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SMS_API_KEY ?? ""}`,
    },
    body: JSON.stringify({ from: process.env.SMS_SENDER, to, text: body }),
  });
  if (!res.ok) console.error(`[sms] failed ${res.status} to=${to}`);
}

/** Normalises Mongolian mobile numbers to +976XXXXXXXX, or returns null. */
export function normalizeMnPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^976/, "");
  return /^[6-9]\d{7}$/.test(digits) ? `+976${digits}` : null;
}
