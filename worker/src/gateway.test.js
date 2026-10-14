import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import worker from "./index.js";

// Runs the real Worker against a fake R2 bucket, to prove who can and cannot get which file.
globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };

const files = {
  "v/EP1/full.mp4": Buffer.from("FULLMOVIE".repeat(100)),
  "v/EP1/master.m3u8": Buffer.from("#EXTM3U\n#EXTINF:6,\nseg_00000.ts\n#EXTINF:6,\nseg_00030.ts\n"),
  "v/EP1/seg_00000.ts": Buffer.from("s0"),
  "v/EP1/seg_00030.ts": Buffer.from("s30"),
  "v/EP1-pv/preview.mp4": Buffer.from("PREVIEW"),
};
const env = {
  SIGNING_SECRET: "sec",
  ALLOWED_ORIGINS: "https://site.example",
  VIDEOS: {
    async get(k, o) {
      const b = files[k];
      if (!b) return null;
      const x = o?.range ? b.subarray(o.range.offset, o.range.offset + o.range.length) : b;
      return { body: x, httpEtag: '"e"', text: async () => x.toString() };
    },
    async head(k) {
      const b = files[k];
      return b ? { size: b.length, httpEtag: '"e"' } : null;
    },
  },
};

const now = Math.floor(Date.now() / 1000);
const sig = (exp, limit, seg, id, scope) =>
  createHmac("sha256", "sec")
    .update(scope === undefined ? `${exp}.${limit}.${seg}.${id}` : `${exp}.${limit}.${seg}.${id}.${scope}`)
    .digest("base64url")
    .slice(0, 32);
const scopeOf = (file) => (file.endsWith(".mp4") ? file : "hls");
/** A link as the app signs it today. */
const link = (id, limit, file, exp = now + 3600) => `/p/${exp}/${limit}/6/${sig(exp, limit, 6, id, scopeOf(file))}/v/${id}/${file}`;
/** A link as the app signed it before files were part of the signature. */
const legacy = (id, limit, file, exp = now + 3600) => `/p/${exp}/${limit}/6/${sig(exp, limit, 6, id)}/v/${id}/${file}`;
const status = async (path, headers = {}) =>
  (await worker.fetch(new Request(`https://w.example${path}`, { headers }), env, { waitUntil() {} })).status;

test("no signature: R2 paths are not reachable", async () => {
  assert.equal(await status("/v/EP1/full.mp4"), 404);
});

test("full link works, including Range requests; expired link does not", async () => {
  assert.equal(await status(link("EP1", 0, "full.mp4")), 200);
  assert.equal(await status(link("EP1", 0, "full.mp4"), { Range: "bytes=0-8" }), 206);
  assert.equal(await status(link("EP1", 0, "full.mp4", now - 10)), 403);
});

test("a preview (HLS) link cannot open the full MP4", async () => {
  assert.equal(await status(link("EP1", 120, "master.m3u8")), 200);
  assert.equal(await status(link("EP1", 120, "seg_00030.ts")), 403); // past the preview
  // Same signature, path swapped to the full file:
  const swapped = link("EP1", 120, "master.m3u8").replace("master.m3u8", "full.mp4");
  assert.equal(await status(swapped), 403);
});

test("an old-style preview link (signed before this fix) cannot open the full MP4 either", async () => {
  const swapped = legacy("EP1", 120, "master.m3u8").replace("master.m3u8", "full.mp4");
  assert.equal(await status(swapped), 403);
  assert.equal(await status(legacy("EP1", 120, "master.m3u8")), 200); // still plays until it expires
});

test("old-style full links keep working until they expire", async () => {
  assert.equal(await status(legacy("EP1", 0, "full.mp4")), 200);
});

test("changing the preview limit in the path breaks the signature", async () => {
  const p = link("EP1", 120, "master.m3u8").replace("/120/", "/0/");
  assert.equal(await status(p), 403);
});

test("a free-preview clip link opens only the clip, never the movie", async () => {
  assert.equal(await status(link("EP1-pv", 0, "preview.mp4")), 200);
  const toFull = link("EP1-pv", 0, "preview.mp4").replace("v/EP1-pv/preview.mp4", "v/EP1/full.mp4");
  assert.equal(await status(toFull), 403);
});
