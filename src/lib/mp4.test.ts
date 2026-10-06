import { test } from "node:test";
import assert from "node:assert/strict";
import { checkFastStart } from "./mp4";

function box(type: string, payload = 8) {
  const b = new Uint8Array(8 + payload);
  new DataView(b.buffer).setUint32(0, b.length);
  b.set([...type].map((c) => c.charCodeAt(0)), 4);
  return b;
}
const file = (...boxes: Uint8Array[]) => {
  const all = new Uint8Array(boxes.reduce((n, b) => n + b.length, 0));
  let o = 0;
  for (const b of boxes) {
    all.set(b, o);
    o += b.length;
  }
  return all;
};
const reader = (f: Uint8Array) => async (o: number, l: number) => f.slice(o, o + l);

test("faststart: moov before mdat", async () => {
  const f = file(box("ftyp", 12), box("moov", 100), box("mdat", 1000));
  assert.equal(await checkFastStart(reader(f), f.length), "ok");
});
test("moov at the end is detected", async () => {
  const f = file(box("ftyp", 12), box("free", 4), box("mdat", 1000), box("moov", 100));
  assert.equal(await checkFastStart(reader(f), f.length), "moov-last");
});
test("not an mp4", async () => {
  const f = file(box("RIFF", 20));
  assert.equal(await checkFastStart(reader(f), f.length), "not-mp4");
});
