/** One-time setup: lets the admin page upload video parts straight from the browser to the R2 bucket.
 *  Usage:  npm run r2:cors -- https://movie-nu-brown.vercel.app
 *  (needs R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET in .env)
 */
import "dotenv/config";
import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const origins = process.argv.slice(2);
if (!origins.length) {
  console.error("Usage: npm run r2:cors -- https://your-site.example [more origins]");
  process.exit(1);
}
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});
await s3.send(
  new PutBucketCorsCommand({
    Bucket: process.env.R2_BUCKET || "mhub-videos",
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: [...origins, "http://localhost:3000"],
          AllowedMethods: ["PUT", "GET", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);
console.log("CORS set for:", origins.join(", "));
