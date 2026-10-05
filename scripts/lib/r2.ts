/** Uploads files to Cloudflare R2 through its S3-compatible API. */
import { readFileSync } from "node:fs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const account = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET || "mhub-videos";
if (!account || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error("R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY are not set in .env");
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${account}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});

const types: Record<string, string> = {
  m3u8: "application/vnd.apple.mpegurl",
  ts: "video/mp2t",
  jpg: "image/jpeg",
};

export async function uploadOne(path: string, key: string) {
  const ext = key.split(".").pop() ?? "";
  for (let attempt = 1; ; attempt++) {
    try {
      await s3.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: readFileSync(path), ContentType: types[ext] ?? "application/octet-stream" }),
      );
      return;
    } catch (e) {
      if (attempt >= 4) throw e;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

/** Uploads with limited parallelism; segments are small (a few MB), so 8 at a time is plenty. */
export async function uploadMany(files: { path: string; key: string }[], concurrency = 8) {
  let i = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (i < files.length) {
        const f = files[i++];
        await uploadOne(f.path, f.key);
      }
    }),
  );
}
