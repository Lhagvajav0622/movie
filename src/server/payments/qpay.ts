import type { Invoice, PaymentProvider } from "./types";

/**
 * QPay V2 (merchant.qpay.mn).
 *   POST /v2/auth/token      Basic auth (username:password) → access_token + expires_in (unix seconds)
 *   POST /v2/invoice         create a dynamic invoice → invoice_id, qr_text, qr_image, urls[]
 *   POST /v2/payment/check   { object_type: "INVOICE", object_id } → rows[{ payment_status, payment_amount }]
 * Env: QPAY_BASE_URL, QPAY_USERNAME, QPAY_PASSWORD, QPAY_INVOICE_CODE, and the site URL for the callback
 * (NEXT_PUBLIC_SITE_URL or BETTER_AUTH_URL).
 * The callback only tells us "something happened"; payment is always confirmed by asking QPay (payment/check).
 */

const env = (k: string) => (process.env[k] ?? "").trim();
const baseUrl = () => (env("QPAY_BASE_URL") || "https://merchant.qpay.mn").replace(/\/$/, "");
const siteUrl = () => (env("NEXT_PUBLIC_SITE_URL") || env("BETTER_AUTH_URL")).replace(/\/$/, "");

let cached: { token: string; expiresAt: number } | null = null;

/** Test hook: forget the cached token. */
export function resetQpayToken() {
  cached = null;
}

async function request(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${baseUrl()}${path}`, { ...init, signal: AbortSignal.timeout(15_000) });
}

/** The token is reused until shortly before it expires (QPay asks merchants not to request one per call). */
async function accessToken(force = false): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (!force && cached && cached.expiresAt - 60 > now) return cached.token;
  const basic = Buffer.from(`${env("QPAY_USERNAME")}:${env("QPAY_PASSWORD")}`).toString("base64");
  const res = await request("/v2/auth/token", { method: "POST", headers: { Authorization: `Basic ${basic}` } });
  if (!res.ok) throw new Error(`QPay auth failed (${res.status})`);
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) throw new Error("QPay auth: no access_token");
  // expires_in is a unix timestamp; fall back to 50 minutes if it looks like a duration instead.
  const exp = j.expires_in && j.expires_in > 1e9 ? j.expires_in : now + 3000;
  cached = { token: j.access_token, expiresAt: exp };
  return cached.token;
}

/** POST JSON with the bearer token; if QPay says 401 the token is renewed once. */
async function post<T>(path: string, body: unknown): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const token = await accessToken(attempt > 0);
    const res = await request(path, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401 && attempt === 0) continue;
    if (!res.ok) throw new Error(`QPay ${path} failed (${res.status})`);
    return (await res.json()) as T;
  }
}

type InvoiceResponse = {
  invoice_id?: string;
  qr_text?: string;
  qr_image?: string;
  urls?: { name?: string; description?: string; link?: string }[];
};
type CheckResponse = { count?: number; paid_amount?: number; rows?: { payment_status?: string; payment_amount?: number | string }[] };

export const qpayProvider: PaymentProvider = {
  live: true,
  available: () =>
    Boolean(env("QPAY_USERNAME") && env("QPAY_PASSWORD") && env("QPAY_INVOICE_CODE") && siteUrl()),

  async createInvoice({ code, amountMnt, description }): Promise<Invoice> {
    const j = await post<InvoiceResponse>("/v2/invoice", {
      invoice_code: env("QPAY_INVOICE_CODE"),
      sender_invoice_no: code,
      invoice_receiver_code: code,
      invoice_description: description.slice(0, 200),
      amount: amountMnt,
      callback_url: `${siteUrl()}/api/payments/qpay/callback?code=${encodeURIComponent(code)}`,
    });
    if (!j.invoice_id) throw new Error("QPay invoice: no invoice_id");
    return {
      invoiceId: j.invoice_id,
      qrText: j.qr_text,
      qrImage: j.qr_image,
      links: (j.urls ?? [])
        .filter((u): u is { name?: string; description?: string; link: string } => Boolean(u.link))
        .map((u) => ({ name: u.name ?? u.description ?? "", description: u.description, link: u.link })),
    };
  },

  async isPaid(invoiceId, amountMnt): Promise<boolean> {
    const j = await post<CheckResponse>("/v2/payment/check", {
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    });
    const paid = (j.rows ?? [])
      .filter((r) => r.payment_status === "PAID")
      .reduce((sum, r) => sum + Number(r.payment_amount ?? 0), 0);
    return paid >= amountMnt;
  },
};
