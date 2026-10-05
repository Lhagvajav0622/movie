import test from "node:test";
import assert from "node:assert/strict";
import { generateOrderCode } from "./order-code";

test("order code format", () => {
  for (let i = 0; i < 50; i++) assert.match(generateOrderCode(), /^MH-[A-HJ-NP-Z2-9]{6}$/);
});
test("order code uses injected rng", () => {
  assert.equal(generateOrderCode(() => 0), "MH-AAAAAA");
});
