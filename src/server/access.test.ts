import { test } from "node:test";
import assert from "node:assert/strict";
import { episodeAccess } from "./access";

const film = [{ id: "f1", number: 1, durationSec: 7200 }];
const drama = [1, 2, 3, 4].map((n) => ({ id: `e${n}`, number: n, durationSec: 150 }));
const base = { priceMnt: 4000, freePreviewSec: 300, owned: false };

test("free title is fully watchable", () => {
  assert.deepEqual(episodeAccess({ ...base, priceMnt: 0, episodes: film, episodeId: "f1" }), { kind: "full" });
});

test("owned title is fully watchable", () => {
  assert.deepEqual(episodeAccess({ ...base, owned: true, episodes: film, episodeId: "f1" }), { kind: "full" });
});

test("paid film gives 5-minute preview", () => {
  assert.deepEqual(episodeAccess({ ...base, episodes: film, episodeId: "f1" }), { kind: "preview", allowedSec: 300 });
});

test("drama: 5 minutes cover episodes 1-2, episode 3 locked", () => {
  assert.deepEqual(episodeAccess({ ...base, episodes: drama, episodeId: "e1" }), { kind: "full" });
  assert.deepEqual(episodeAccess({ ...base, episodes: drama, episodeId: "e2" }), { kind: "full" });
  assert.deepEqual(episodeAccess({ ...base, episodes: drama, episodeId: "e3" }), { kind: "locked" });
});

test("drama: partial episode becomes a preview", () => {
  assert.deepEqual(
    episodeAccess({ ...base, freePreviewSec: 200, episodes: drama, episodeId: "e2" }),
    { kind: "preview", allowedSec: 50 },
  );
});

test("separate free clip: viewer gets the clip, owner gets everything", () => {
  const eps = [{ id: "m1", number: 1, durationSec: 7200, hasPreviewClip: true, hasFull: true, hasHls: false }];
  assert.deepEqual(episodeAccess({ ...base, episodes: eps, episodeId: "m1" }), { kind: "clip" });
  assert.deepEqual(episodeAccess({ ...base, owned: true, episodes: eps, episodeId: "m1" }), { kind: "full" });
});

test("clip without a paid version is a free episode", () => {
  const eps = [
    { id: "a", number: 1, durationSec: 150, hasPreviewClip: true, hasFull: false, hasHls: false },
    { id: "b", number: 2, durationSec: 150, hasPreviewClip: false, hasFull: true, hasHls: false },
  ];
  assert.deepEqual(episodeAccess({ ...base, episodes: eps, episodeId: "a" }), { kind: "full" });
  assert.deepEqual(episodeAccess({ ...base, episodes: eps, episodeId: "b" }), { kind: "locked" });
});

test("legacy HLS cut ignores MP4-only episodes in the cumulative count", () => {
  const eps = [
    { id: "x", number: 1, durationSec: 150, hasHls: false, hasFull: true },
    { id: "h1", number: 2, durationSec: 150, hasHls: true, hasFull: true },
  ];
  assert.deepEqual(episodeAccess({ ...base, episodes: eps, episodeId: "h1" }), { kind: "full" });
});
