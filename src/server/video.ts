import { createHmac } from "node:crypto";

/**
 * Builds a signed playback URL for the Cloudflare video Worker.
 * Must match worker/src/logic.js (payload "{exp}.{limit}.{seg}.{episodeId}", base64url HMAC, 32 chars).
 */
export function signPlaybackUrl(opts: {
  episodeId: string;
  videoKey: string; // "v/<episodeId>" (HLS / full MP4) or "v/<episodeId>-pv" (preview MP4)
  limitSec: number; // 0 = full access
  segmentSec: number;
  /** file under videoKey; default is the HLS master playlist */
  file?: "master.m3u8" | "full.mp4" | "preview.mp4";
  ttlSec?: number;
  baseUrl?: string;
  secret?: string;
  now?: number;
}): string {
  const base = (opts.baseUrl ?? process.env.VIDEO_BASE_URL ?? "").replace(/\/$/, "");
  const secret = opts.secret ?? process.env.VIDEO_SIGNING_SECRET ?? "";
  if (!base || !secret) throw new Error("VIDEO_BASE_URL / VIDEO_SIGNING_SECRET not configured");
  const exp = Math.floor((opts.now ?? Date.now()) / 1000) + (opts.ttlSec ?? 6 * 3600);
  const limit = Math.max(0, Math.floor(opts.limitSec));
  const seg = opts.segmentSec;
  const sig = createHmac("sha256", secret)
    .update(`${exp}.${limit}.${seg}.${opts.episodeId}`)
    .digest("base64url")
    .slice(0, 32);
  return `${base}/p/${exp}/${limit}/${seg}/${sig}/${opts.videoKey}/${opts.file ?? "master.m3u8"}`;
}

export const thumbnailUrl = (episodeId: string, baseUrl = process.env.VIDEO_BASE_URL ?? "") =>
  `${baseUrl.replace(/\/$/, "")}/thumb/${episodeId}.jpg`;

export const videoConfigured = () => Boolean(process.env.VIDEO_BASE_URL && process.env.VIDEO_SIGNING_SECRET);

/** R2 keys for the two MP4 files of an episode. The preview lives under a different "episode" scope
 *  so a signed preview link can never be turned into a link to the full movie. */
export const mp4Keys = (episodeId: string) => ({
  full: { prefix: `v/${episodeId}`, scope: episodeId, file: "full.mp4" as const, key: `v/${episodeId}/full.mp4` },
  preview: { prefix: `v/${episodeId}-pv`, scope: `${episodeId}-pv`, file: "preview.mp4" as const, key: `v/${episodeId}-pv/preview.mp4` },
});

/** Signed URL for one of the episode's MP4 files (no time limit: the preview is its own file). */
export function signMp4Url(episodeId: string, kind: "full" | "preview", ttlSec?: number) {
  const k = mp4Keys(episodeId)[kind];
  return signPlaybackUrl({ episodeId: k.scope, videoKey: k.prefix, file: k.file, limitSec: 0, segmentSec: 6, ttlSec });
}
