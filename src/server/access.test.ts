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
