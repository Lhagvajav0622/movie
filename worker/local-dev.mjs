// Local test harness: runs the real Worker code against a folder instead of R2.
import http from "node:http";
import { readFile } from "node:fs/promises";
import worker from "./src/index.js";
const ROOT = process.env.STORE;
globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
const env = {
  SIGNING_SECRET: "local-secret",
  ALLOWED_ORIGINS: "*",
  VIDEOS: {
    async get(key) {
      try {
        const buf = await readFile(`${ROOT}/${key}`);
        return { body: buf, httpEtag: '"x"', text: async () => buf.toString() };
      } catch { return null; }
    },
  },
};
http.createServer(async (req, res) => {
  const r = await worker.fetch(new Request(`http://localhost:8787${req.url}`, { method: req.method, headers: req.headers }), env, { waitUntil() {} });
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8787, () => console.log("worker on 8787"));
