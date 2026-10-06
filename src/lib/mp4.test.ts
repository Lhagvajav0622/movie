import { test } from "node:test";
import assert from "node:assert/strict";
import { checkFastStart, makeFastStart } from "./mp4";

function box(type: string, payload = 8) {
  const b = new Uint8Array(8 + payload);
  new DataView(b.buffer).setUint32(0, b.length);
  b.set(
    [...type].map((c) => c.charCodeAt(0)),
    4,
  );
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
const reader = (f: Uint8Array) => async (o: number, l: number) =>
  f.slice(o, o + l);

test("faststart: moov before mdat", async () => {
  const f = file(box("ftyp", 12), box("moov", 100), box("mdat", 1000));
  assert.equal(await checkFastStart(reader(f), f.length), "ok");
});
test("moov at the end is detected", async () => {
  const f = file(
    box("ftyp", 12),
    box("free", 4),
    box("mdat", 1000),
    box("moov", 100),
  );
  assert.equal(await checkFastStart(reader(f), f.length), "moov-last");
});
test("not an mp4", async () => {
  const f = file(box("RIFF", 20));
  assert.equal(await checkFastStart(reader(f), f.length), "not-mp4");
});

{
  const box = (type: string, ...parts: Uint8Array[]) => {
    const len = parts.reduce((a, p) => a + p.length, 0);
    const out = new Uint8Array(8 + len);
    new DataView(out.buffer).setUint32(0, 8 + len);
    out.set(new TextEncoder().encode(type), 4);
    let o = 8;
    for (const p of parts) {
      out.set(p, o);
      o += p.length;
    }
    return out;
  };
  const u32 = (...n: number[]) => {
    const b = new Uint8Array(n.length * 4);
    const dv = new DataView(b.buffer);
    n.forEach((v, i) => dv.setUint32(i * 4, v));
    return b;
  };

  test("makeFastStart moves moov first and shifts chunk offsets", async () => {
    const ftyp = box("ftyp", new TextEncoder().encode("isom"), u32(0));
    const mdat = box("mdat", new Uint8Array(100));
    const chunkAt = ftyp.length + 8;
    const stco = box("stco", u32(0, 1, chunkAt));
    const moov = box(
      "moov",
      box("trak", box("mdia", box("minf", box("stbl", stco)))),
    );
    const file = new Blob([ftyp, mdat, moov]);
    const read = (b: Blob) => async (o: number, l: number) =>
      new Uint8Array(await b.slice(o, o + l).arrayBuffer());
    assert.equal(await checkFastStart(read(file), file.size), "moov-last");
    const out = await makeFastStart(file);
    assert.equal(out.size, file.size);
    assert.equal(await checkFastStart(read(out), out.size), "ok");
    const bytes = new Uint8Array(await out.arrayBuffer());
    const dv = new DataView(bytes.buffer);
    const idx = new TextDecoder("latin1").decode(bytes).indexOf("stco");
    assert.equal(dv.getUint32(idx + 4 + 8), chunkAt + moov.length);
  });
}
