import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const imageStorageConfigured = () =>
  Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.VIDEO_BASE_URL,
  );

let client: S3Client | null = null;
function s3() {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

const EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
export const allowedImageType = (t: string) => t in EXT;

/** Stores a poster / backdrop in R2 and returns its public URL (served by the video Worker at /img/...). */
export async function putImage(body: Uint8Array, contentType: string): Promise<string> {
  const name = `${crypto.randomUUID()}.${EXT[contentType]}`;
  await s3().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || "mhub-videos",
      Key: `i/${name}`,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `${process.env.VIDEO_BASE_URL!.replace(/\/$/, "")}/img/${name}`;
}
