// Prints how an MP4 is laid out, to find out why a file starts slowly in the browser.
// Usage: node scripts/mp4info.mjs "file.mp4"
import fs from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/mp4info.mjs "file.mp4"');
  process.exit(1);
}
const fd = fs.openSync(path, "r");
const size = fs.fstatSync(fd).size;
const read = (off, len) => {
  const b = Buffer.alloc(len);
  fs.readSync(fd, b, 0, len, off);
  return b;
};

const top = [];
for (let off = 0; off + 8 <= size; ) {
  const h = read(off, 16);
  let sz = h.readUInt32BE(0);
  const type = h.toString("latin1", 4, 8);
  if (sz === 1) sz = Number(h.readBigUInt64BE(8));
  else if (sz === 0) sz = size - off;
  if (sz < 8) break;
  top.push({ type, start: off, size: sz });
  off += sz;
}
const mb = (n) => (n / 1048576).toFixed(1) + " MB";
console.log(`File: ${mb(size)}`);
console.log("Top-level boxes:", top.map((b) => `${b.type}@${mb(b.start)}(${mb(b.size)})`).join("  "));
const moovBox = top.find((b) => b.type === "moov");
if (!moovBox) {
  console.log("NO moov box found");
  process.exit(0);
}
console.log(`moov position: ${top.indexOf(moovBox) < top.findIndex((b) => b.type === "mdat") ? "FIRST (faststart OK)" : "LAST (not faststart)"}, size ${mb(moovBox.size)}`);

const moov = read(moovBox.start, moovBox.size);
const CONT = new Set(["moov", "trak", "mdia", "minf", "stbl"]);
const tracks = [];
let cur = null;
(function walk(s, e) {
  for (let p = s; p + 8 <= e; ) {
    let sz = moov.readUInt32BE(p);
    const type = moov.toString("latin1", p + 4, p + 8);
    let hdr = 8;
    if (sz === 1) {
      sz = Number(moov.readBigUInt64BE(p + 8));
      hdr = 16;
    }
    if (sz < hdr) return;
    const b = p + hdr;
    if (type === "trak") {
      cur = { kind: "?", codec: "?", chunks: [], samples: 0, ts: 1, dur: 0 };
      tracks.push(cur);
    }
    if (CONT.has(type)) walk(b, p + sz);
    else if (cur) {
      if (type === "hdlr") cur.kind = moov.toString("latin1", b + 8, b + 12);
      else if (type === "mdhd") {
        const v = moov[b];
        cur.ts = moov.readUInt32BE(b + (v === 1 ? 20 : 12));
        cur.dur = v === 1 ? Number(moov.readBigUInt64BE(b + 24)) : moov.readUInt32BE(b + 16);
      } else if (type === "stsd") cur.codec = moov.toString("latin1", b + 12, b + 16);
      else if (type === "stsz") cur.samples = moov.readUInt32BE(b + 8) || moov.readUInt32BE(b + 8 + 4);
      else if (type === "stco") {
        const n = moov.readUInt32BE(b + 4);
        for (let i = 0; i < n; i++) cur.chunks.push(moov.readUInt32BE(b + 8 + i * 4));
      } else if (type === "co64") {
        const n = moov.readUInt32BE(b + 4);
        for (let i = 0; i < n; i++) cur.chunks.push(Number(moov.readBigUInt64BE(b + 8 + i * 8)));
      }
    }
    p += sz;
  }
})(8, moov.length);

let durSec = 0;
for (const t of tracks) {
  const d = t.dur / t.ts;
  durSec = Math.max(durSec, d);
  console.log(
    `track ${t.kind} codec=${t.codec} duration=${d.toFixed(1)}s samples=${t.samples} chunks=${t.chunks.length} firstChunk@${mb(t.chunks[0] ?? 0)} lastChunk@${mb(t.chunks[t.chunks.length - 1] ?? 0)}`,
  );
}
if (durSec) console.log(`average bitrate: ${((size * 8) / durSec / 1e6).toFixed(2)} Mbit/s`);

// How often does the file switch between tracks while reading it front to back?
const all = tracks.flatMap((t, i) => t.chunks.map((o) => ({ o, i }))).sort((a, b) => a.o - b.o);
let switches = 0;
for (let k = 1; k < all.length; k++) if (all[k].i !== all[k - 1].i) switches++;
console.log(`track switches while reading the file in order: ${switches} (a well-interleaved file: thousands; a few: audio and video are stored apart = slow start)`);
