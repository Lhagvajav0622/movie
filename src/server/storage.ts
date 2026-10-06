import "server-only";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

const bucket = () => process.env.R2_BUCKET || "mhub-videos";

/** Browser-direct multipart upload: the server only hands out short-lived part URLs, the file never passes through Vercel. */
export async function startMultipart(key: string, contentType: string) {
  const r = await s3().send(new CreateMultipartUploadCommand({ Bucket: bucket(), Key: key, ContentType: contentType }));
  return r.UploadId!;
}

export async function presignParts(key: string, uploadId: string, partNumbers: number[]) {
  return Promise.all(
    partNumbers.map(async (n) => ({
      partNumber: n,
      url: await getSignedUrl(s3(), new UploadPartCommand({ Bucket: bucket(), Key: key, UploadId: uploadId, PartNumber: n }), {
        expiresIn: 3600,
      }),
    })),
  );
}

export async function completeMultipart(key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) {
  await s3().send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: [...parts].sort((a, b) => a.partNumber - b.partNumber).map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
      },
    }),
  );
  const head = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
  return head.ContentLength ?? 0;
}

export async function abortMultipart(key: string, uploadId: string) {
  await s3().send(new AbortMultipartUploadCommand({ Bucket: bucket(), Key: key, UploadId: uploadId })).catch(() => {});
}

export async function deleteObjects(keys: string[]) {
  if (!keys.length) return;
  await s3().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: keys.map((Key) => ({ Key })) } })).catch(() => {});
}
