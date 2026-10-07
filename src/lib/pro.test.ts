import { test } from "node:test";
import assert from "node:assert/strict";
import { proActive, proDaysLeft } from "./pro";

const now = new Date("2026-10-07T00:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

test("a pass without end date stays active", () => {
  assert.equal(proActive({ expiresAt: null }, now), true);
  assert.equal(proDaysLeft(null, now), null);
});
test("a pass is active until its end date, then not", () => {
  assert.equal(proActive({ expiresAt: days(3) }, now), true);
  assert.equal(proActive({ expiresAt: days(-1) }, now), false);
  assert.equal(proActive(undefined, now), false);
});
test("days left rounds up and never goes below zero", () => {
  assert.equal(proDaysLeft(days(30), now), 30);
  assert.equal(proDaysLeft(new Date(now.getTime() + 3_600_000), now), 1);
  assert.equal(proDaysLeft(days(-5), now), 0);
});
