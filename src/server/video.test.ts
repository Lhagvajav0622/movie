import { test } from "node:test";
import assert from "node:assert/strict";
import { signPlaybackUrl } from "./video";
// The Worker's own helpers, to prove both sides agree on the signature.
import { base64url, parseSignedPath, signingPayload } from "../../worker/src/logic.js";

async function workerSig(secret: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64url(new Uint8Array(sig)).slice(0, 32);
}

test("app-signed URL verifies with the Worker algorithm", async () => {
  const url = signPlaybackUrl({
    episodeId: "0b6f1d2e-1111-2222-3333-444455556666",
    videoKey: "v/0b6f1d2e-1111-2222-3333-444455556666",
    limitSec: 300,
    segmentSec: 6,
    baseUrl: "https://mhub-video.example.workers.dev",
    secret: "test-secret",
    now: 1_800_000_000_000,
  });
  const p = parseSignedPath(new URL(url).pathname);
  assert.ok(p, "path parses");
  assert.equal(p.limit, 300);
  assert.equal(p.key, "v/0b6f1d2e-1111-2222-3333-444455556666/master.m3u8");
  const expected = await workerSig("test-secret", signingPayload(p.exp, p.limit, p.seg, p.episodeId));
  assert.equal(p.sig, expected);
});

test("preview MP4 link cannot be reused for the full MP4", async () => {
  const id = "0b6f1d2e-1111-2222-3333-444455556666";
  const prev = signPlaybackUrl({
    episodeId: `${id}-pv`,
    videoKey: `v/${id}-pv`,
    file: "preview.mp4",
    limitSec: 0,
    segmentSec: 6,
    baseUrl: "https://w.example",
    secret: "s",
    now: 1_800_000_000_000,
  });
  const p = parseSignedPath(new URL(prev).pathname)!;
  assert.equal(p.key, `v/${id}-pv/preview.mp4`);
  assert.equal(p.episodeId, `${id}-pv`);
  // Swapping the path to the full file changes the episode scope, so the signature no longer matches.
  const swapped = parseSignedPath(new URL(prev).pathname.replace(`v/${id}-pv/preview.mp4`, `v/${id}/full.mp4`))!;
  const expected = await workerSig("s", signingPayload(swapped.exp, swapped.limit, swapped.seg, swapped.episodeId));
  assert.notEqual(swapped.sig, expected);
});
