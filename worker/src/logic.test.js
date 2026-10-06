import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRange, parseSignedPath, segmentPastLimit, truncatePlaylist } from "./logic.js";

const media = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:6.000,
seg_00000.ts
#EXTINF:6.000,
seg_00001.ts
#EXTINF:6.000,
seg_00002.ts
#EXTINF:4.500,
seg_00003.ts
#EXT-X-ENDLIST
`;

test("truncates media playlist at the preview limit", () => {
  const out = truncatePlaylist(media, 10);
  assert.ok(out.includes("seg_00000.ts"));
  assert.ok(out.includes("seg_00001.ts"));
  assert.ok(!out.includes("seg_00002.ts"));
  assert.ok(out.trim().endsWith("#EXT-X-ENDLIST"));
});

test("full access leaves playlist unchanged", () => {
  assert.equal(truncatePlaylist(media, 0), media);
});

test("master playlist is not truncated", () => {
  const master = "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1400000\n720p/index.m3u8\n";
  assert.equal(truncatePlaylist(master, 300), master);
});

test("segments past the limit are blocked", () => {
  assert.equal(segmentPastLimit("v/x/720p/seg_00049.ts", 300, 6), false); // starts at 294s
  assert.equal(segmentPastLimit("v/x/720p/seg_00050.ts", 300, 6), true); // starts at 300s
  assert.equal(segmentPastLimit("v/x/720p/seg_09999.ts", 0, 6), false);
});

test("parses signed paths and rejects traversal", () => {
  const ok = parseSignedPath("/p/1900000000/300/6/abcDEF_-123/v/1b2c-3d/720p/index.m3u8");
  assert.deepEqual(ok && { ...ok }, {
    exp: 1900000000,
    limit: 300,
    seg: 6,
    sig: "abcDEF_-123",
    key: "v/1b2c-3d/720p/index.m3u8",
    episodeId: "1b2c-3d",
  });
  assert.equal(parseSignedPath("/p/1/0/6/sig/v/abc/../../secret"), null);
  assert.equal(parseSignedPath("/v/abc/master.m3u8"), null);
});

test("parses HTTP Range headers", () => {
  assert.equal(parseRange(null, 1000), null);
  assert.deepEqual(parseRange("bytes=0-99", 1000), { start: 0, end: 99 });
  assert.deepEqual(parseRange("bytes=500-", 1000), { start: 500, end: 999 });
  assert.deepEqual(parseRange("bytes=-200", 1000), { start: 800, end: 999 });
  assert.deepEqual(parseRange("bytes=900-5000", 1000), { start: 900, end: 999 });
  assert.equal(parseRange("bytes=1000-", 1000), "invalid");
  assert.equal(parseRange("bytes=-0", 1000), "invalid");
  assert.equal(parseRange("garbage", 1000), null);
});
