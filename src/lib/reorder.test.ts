import { test } from "node:test";
import assert from "node:assert/strict";
import { moveId } from "./reorder";

test("moveId swaps with the neighbour", () => {
  assert.deepEqual(moveId(["a", "b", "c"], "b", "up"), ["b", "a", "c"]);
  assert.deepEqual(moveId(["a", "b", "c"], "b", "down"), ["a", "c", "b"]);
});

test("moveId does nothing at the ends or for unknown ids", () => {
  assert.deepEqual(moveId(["a", "b"], "a", "up"), ["a", "b"]);
  assert.deepEqual(moveId(["a", "b"], "b", "down"), ["a", "b"]);
  assert.deepEqual(moveId(["a", "b"], "x", "up"), ["a", "b"]);
});

test("moveId does not mutate its input", () => {
  const src = ["a", "b"];
  moveId(src, "a", "down");
  assert.deepEqual(src, ["a", "b"]);
});
