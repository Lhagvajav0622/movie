/**
 * Mhub video gateway (Cloudflare Worker).
 * - Serves HLS files from the R2 bucket bound as VIDEOS, only with a valid signed path.
 * - Enforces the free preview: playlists are cut and later segments refused.
 * - Caches segments and full playlists at the edge (Cloudflare has an Ulaanbaatar PoP).
 * - Serves episode thumbnails publicly at /thumb/{episodeId}.jpg.
 * - Serves admin-uploaded posters / backdrops publicly at /img/{uuid}.{webp|jpg|png} (R2 key i/{uuid}.ext).
 *
 * Secrets / bindings (see wrangler.toml):  VIDEOS (R2 bucket), SIGNING_SECRET, ALLOWED_ORIGINS
 */
import {
  base64url,
  contentType,
  parseSignedPath,
  safeEqual,
  segmentPastLimit,
  signingPayload,
  truncatePlaylist,
} from "./logic.js";

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64url(new Uint8Array(sig)).slice(0, 32);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
  const ok = allowed.includes("*") || allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin || "*" : "null",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range",
    Vary: "Origin",
  };
}

const deny = (status, cors) => new Response(status === 403 ? "Forbidden" : "Not found", { status, headers: cors });

async function fromR2(env, key, request, cacheKeyUrl, ctx, cors, cacheable) {
  const cache = caches.default;
  const cacheKey = new Request(cacheKeyUrl, { method: "GET" });
  if (cacheable) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const r = new Response(hit.body, hit);
      for (const [k, v] of Object.entries(cors)) r.headers.set(k, v);
      return r;
    }
  }
  const obj = await env.VIDEOS.get(key);
  if (!obj) return null;
  const headers = new Headers(cors);
  headers.set("Content-Type", contentType(key));
  headers.set("Cache-Control", cacheable ? "public, max-age=31536000, immutable" : "private, max-age=60");
  headers.set("ETag", obj.httpEtag);
  const res = new Response(obj.body, { headers });
  if (cacheable && request.method === "GET") ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

const worker = {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "GET" && request.method !== "HEAD") return deny(403, cors);

    const url = new URL(request.url);

    // Public thumbnails
    const thumb = url.pathname.match(/^\/thumb\/([A-Za-z0-9-]+)\.jpg$/);
    if (thumb) {
      const res = await fromR2(env, `t/${thumb[1]}.jpg`, request, `https://cache.mhub/t/${thumb[1]}.jpg`, ctx, cors, true);
      return res || deny(404, cors);
    }

    // Public posters / backdrops uploaded from the admin panel (random names, never change)
    const img = url.pathname.match(/^\/img\/([A-Za-z0-9-]{8,64}\.(?:webp|jpg|png))$/);
    if (img) {
      const res = await fromR2(env, `i/${img[1]}`, request, `https://cache.mhub/i/${img[1]}`, ctx, cors, true);
      return res || deny(404, cors);
    }

    if (url.pathname === "/health") return new Response("ok", { headers: cors });

    const p = parseSignedPath(url.pathname);
    if (!p) return deny(404, cors);
    if (p.exp < Math.floor(Date.now() / 1000)) return deny(403, cors);
    const expected = await hmac(env.SIGNING_SECRET, signingPayload(p.exp, p.limit, p.seg, p.episodeId));
    if (!safeEqual(expected, p.sig)) return deny(403, cors);
    if (segmentPastLimit(p.key, p.limit, p.seg)) return deny(403, cors);

    const isPlaylist = p.key.endsWith(".m3u8");
    if (isPlaylist && p.limit > 0) {
      const obj = await env.VIDEOS.get(p.key);
      if (!obj) return deny(404, cors);
      const body = truncatePlaylist(await obj.text(), p.limit);
      return new Response(body, {
        headers: { ...cors, "Content-Type": contentType(p.key), "Cache-Control": "private, max-age=60" },
      });
    }

    // Segments and full playlists are identical for everyone: cache by object key (token stripped).
    const res = await fromR2(env, p.key, request, `https://cache.mhub/${p.key}`, ctx, cors, true);
    return res || deny(404, cors);
  },
};

export default worker;
