import { test } from "node:test";
import assert from "node:assert/strict";
import {
  callProRequest,
  otpMessage,
  resetMessage,
  sendViaCallPro,
  toLocalNumber,
} from "./sms-callpro";

const cfg = { apiKey: "test-key", from: "72700000" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

test("toLocalNumber gives the 8-digit number", () => {
  assert.equal(toLocalNumber("+97699112233"), "99112233");
  assert.equal(toLocalNumber("97699112233"), "99112233");
  assert.equal(toLocalNumber("99112233"), "99112233");
  assert.equal(toLocalNumber("+1 561 276 7156"), "15612767156");
});

test("request: right URL, key in x-api-key, JSON body with local number", () => {
  const { url, init } = callProRequest(cfg, "+97699112233", "hello");
  assert.equal(url, "https://api-text.callpro.mn/v1/sms/send");
  assert.equal(init.method, "POST");
  const h = init.headers as Record<string, string>;
  assert.equal(h["x-api-key"], "test-key");
  assert.equal(h["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(init.body as string), { from: "72700000", to: "99112233", text: "hello" });
});

test("request: base URL override, trailing slash tolerated", () => {
  const { url } = callProRequest({ ...cfg, baseUrl: "https://example.test/v1/sms/" }, "99112233", "x");
  assert.equal(url, "https://example.test/v1/sms/send");
});

test("messages carry the brand and fit one Cyrillic segment (70 chars)", () => {
  for (const m of [otpMessage("123456"), resetMessage("123456")]) {
    assert.ok(m.startsWith("Кино Хором"));
    assert.ok(m.includes("123456"));
    assert.ok(m.length <= 70, `${m.length} chars: ${m}`);
  }
});

test("success returns the message id", async () => {
  const r = await sendViaCallPro(cfg, "99112233", "x", async () => json({ status: "queued", message_id: "a1b2" }));
  assert.deepEqual(r, { ok: true, status: 200, messageId: "a1b2" });
});

test("API errors are returned, not thrown", async () => {
  const r402 = await sendViaCallPro(cfg, "99112233", "x", async () => json({ error: "Payment not paid" }, 402));
  assert.deepEqual(r402, { ok: false, status: 402, error: "Payment not paid" });
  const r401 = await sendViaCallPro(cfg, "99112233", "x", async () => json({ error: "Unauthorized" }, 401));
  assert.equal(r401.ok, false);
  assert.equal(r401.status, 401);
});

test("network failure is returned, not thrown", async () => {
  const r = await sendViaCallPro(cfg, "99112233", "x", async () => {
    throw new Error("boom");
  });
  assert.deepEqual(r, { ok: false, status: 0, error: "boom" });
});
