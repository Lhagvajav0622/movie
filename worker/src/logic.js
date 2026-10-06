/**
 * Pure helpers shared by the Worker and its tests (no Cloudflare APIs here).
 *
 * Signed path:  /p/{exp}/{limit}/{seg}/{sig}/v/{episodeId}/...
 *   exp    unix seconds when the link stops working
 *   limit  free-preview seconds (0 = full access)
 *   seg    HLS segment length in seconds (to block segments past the limit)
 *   sig    base64url HMAC-SHA256 of "{exp}.{limit}.{seg}.{episodeId}", first 32 chars
 */

export function parseSignedPath(pathname) {
  const m = pathname.match(/^\/p\/(\d+)\/(\d+)\/(\d+)\/([A-Za-z0-9_-]+)\/(v\/([A-Za-z0-9-]+)\/[A-Za-z0-9_\-./]+)$/);
  if (!m) return null;
  const [, exp, limit, seg, sig, key, episodeId] = m;
  if (key.includes("..")) return null;
  return { exp: Number(exp), limit: Number(limit), seg: Number(seg), sig, key, episodeId };
}

export const signingPayload = (exp, limit, seg, episodeId) => `${exp}.${limit}.${seg}.${episodeId}`;

export function base64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Constant-time string compare. */
export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/**
 * Cuts a media playlist after `limitSec` seconds and ends it, so players stop there.
 * Master playlists (no #EXTINF) are returned unchanged.
 */
export function truncatePlaylist(text, limitSec) {
  if (!limitSec || !text.includes("#EXTINF")) return text;
  const lines = text.split(/\r?\n/);
  const out = [];
  let elapsed = 0;
  let pendingInf = null;
  for (const line of lines) {
    if (line.startsWith("#EXT-X-ENDLIST")) continue;
    if (line.startsWith("#EXTINF:")) {
      pendingInf = line;
      continue;
    }
    if (pendingInf !== null) {
      if (line.startsWith("#")) {
        out.push(line); // tags between EXTINF and URI (rare) are kept
        continue;
      }
      const dur = parseFloat(pendingInf.slice(8));
      if (elapsed >= limitSec) break;
      out.push(pendingInf, line);
      elapsed += Number.isFinite(dur) ? dur : 0;
      pendingInf = null;
      continue;
    }
    out.push(line);
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  out.push("#EXT-X-ENDLIST", "");
  return out.join("\n");
}

/** True if a segment file (seg_00012.ts) starts after the preview limit. */
export function segmentPastLimit(key, limitSec, segSec) {
  if (!limitSec) return false;
  const m = key.match(/seg_(\d+)\.(ts|m4s)$/);
  if (!m) return false;
  return Number(m[1]) * segSec >= limitSec;
}

export function contentType(key) {
  if (key.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (key.endsWith(".ts")) return "video/mp2t";
  if (key.endsWith(".m4s")) return "video/iso.segment";
  if (key.endsWith(".mp4")) return "video/mp4";
  if (key.endsWith(".jpg")) return "image/jpeg";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}
