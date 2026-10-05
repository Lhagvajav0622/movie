import { createHmac } from "node:crypto";

/**
 * Builds a signed playback URL for the Cloudflare video Worker.
 * Must match worker/src/logic.js (payload "{exp}.{limit}.{seg}.{episodeId}", base64url HMAC, 32 chars).
 */
export function signPlaybackUrl(opts: {
  episodeId: string;
  videoKey: string; // "v/<episodeId>"
  limitSec: number; // 0 = full access
  segmentSec: number;
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
  return `${base}/p/${exp}/${limit}/${seg}/${sig}/${opts.videoKey}/master.m3u8`;
}

export const thumbnailUrl = (episodeId: string, baseUrl = process.env.VIDEO_BASE_URL ?? "") =>
  `${baseUrl.replace(/\/$/, "")}/thumb/${episodeId}.jpg`;

export const videoConfigured = () => Boolean(process.env.VIDEO_BASE_URL && process.env.VIDEO_SIGNING_SECRET);
