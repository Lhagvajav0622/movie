import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { qpayProvider, resetQpayToken } from "./qpay";

type Call = { url: string; init: RequestInit };
let calls: Call[] = [];
let responses: Response[] = [];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  calls = [];
  responses = [];
  resetQpayToken();
  process.env.QPAY_BASE_URL = "https://qpay.test";
  process.env.QPAY_USERNAME = "user";
  process.env.QPAY_PASSWORD = "pass";
  process.env.QPAY_INVOICE_CODE = "INV_CODE";
  process.env.NEXT_PUBLIC_SITE_URL = "https://kinohorom.mn";
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return responses.shift() ?? json({}, 500);
  }) as typeof fetch;
});

const future = () => Math.floor(Date.now() / 1000) + 3600;

test("available only when credentials and site URL are set", () => {
  assert.equal(qpayProvider.available(), true);
  delete process.env.QPAY_PASSWORD;
  assert.equal(qpayProvider.available(), false);
});

test("creates an invoice with Basic auth, the amount from the order and a callback to our site", async () => {
  responses = [
    json({ access_token: "T1", expires_in: future() }),
    json({ invoice_id: "INV1", qr_image: "AAA", urls: [{ name: "Khan", link: "khan://x" }, { name: "none" }] }),
  ];
  const inv = await qpayProvider.createInvoice({ code: "MH-ABC123", amountMnt: 15000, description: "Кино" });
  assert.equal(inv.invoiceId, "INV1");
  assert.deepEqual(inv.links, [{ name: "Khan", description: undefined, link: "khan://x" }]);
  assert.equal(calls[0].url, "https://qpay.test/v2/auth/token");
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, `Basic ${Buffer.from("user:pass").toString("base64")}`);
  const sent = JSON.parse(String(calls[1].init.body));
  assert.equal(sent.amount, 15000);
  assert.equal(sent.invoice_code, "INV_CODE");
  assert.equal(sent.sender_invoice_no, "MH-ABC123");
  assert.equal(sent.callback_url, "https://kinohorom.mn/api/payments/qpay/callback?code=MH-ABC123");
  assert.equal((calls[1].init.headers as Record<string, string>).Authorization, "Bearer T1");
});

test("the token is reused between calls", async () => {
  responses = [
    json({ access_token: "T1", expires_in: future() }),
    json({ count: 0, rows: [] }),
    json({ count: 0, rows: [] }),
  ];
  await qpayProvider.isPaid("I", 100);
  await qpayProvider.isPaid("I", 100);
  assert.equal(calls.filter((c) => c.url.endsWith("/auth/token")).length, 1);
});

test("a 401 renews the token once and retries", async () => {
  responses = [
    json({ access_token: "T1", expires_in: future() }),
    json({}, 401),
    json({ access_token: "T2", expires_in: future() }),
    json({ count: 1, rows: [{ payment_status: "PAID", payment_amount: 500 }] }),
  ];
  assert.equal(await qpayProvider.isPaid("I", 500), true);
  assert.equal((calls[3].init.headers as Record<string, string>).Authorization, "Bearer T2");
});

test("paid only when PAID rows cover the full amount", async () => {
  const check = async (rows: unknown[], amount: number) => {
    resetQpayToken();
    responses = [json({ access_token: "T", expires_in: future() }), json({ count: rows.length, rows })];
    return qpayProvider.isPaid("I", amount);
  };
  assert.equal(await check([], 1000), false);
  assert.equal(await check([{ payment_status: "NEW", payment_amount: 1000 }], 1000), false);
  assert.equal(await check([{ payment_status: "PAID", payment_amount: 400 }], 1000), false); // short payment
  assert.equal(await check([{ payment_status: "PAID", payment_amount: "1000" }], 1000), true);
  assert.equal(await check([{ payment_status: "PAID", payment_amount: 600 }, { payment_status: "PAID", payment_amount: 400 }], 1000), true);
});

test("provider errors surface (the order is not marked paid)", async () => {
  responses = [json({ access_token: "T", expires_in: future() }), json({}, 500)];
  await assert.rejects(() => qpayProvider.isPaid("I", 100));
});
