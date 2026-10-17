import test from "node:test";
import assert from "node:assert/strict";
import { extendPass } from "./package-pass";

const now = new Date("2026-01-01T00:00:00Z");
test("new pass starts now", () => {
  assert.equal(extendPass(null, 30, now).toISOString(), "2026-01-31T00:00:00.000Z");
});
test("expired pass restarts from now", () => {
  assert.equal(extendPass(new Date("2025-12-01T00:00:00Z"), 30, now).toISOString(), "2026-01-31T00:00:00.000Z");
});
test("running pass is extended, not reset", () => {
  assert.equal(extendPass(new Date("2026-01-11T00:00:00Z"), 30, now).toISOString(), "2026-02-10T00:00:00.000Z");
});
