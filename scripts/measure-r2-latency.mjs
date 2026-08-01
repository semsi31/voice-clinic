/**
 * Measures production R2 put/delete latency (the blocking part of document/receipt deletes).
 * Usage: node --env-file=.env.local scripts/measure-r2-latency.mjs
 */

import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error("Missing Cloudflare R2 env vars");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

async function timed(label, fn) {
  const t0 = performance.now();
  await fn();
  return { label, ms: Math.round(performance.now() - t0) };
}

async function main() {
  const key = `perf-probe/${randomUUID()}.txt`;
  const body = Buffer.from(`voice-perf-probe ${new Date().toISOString()}`);

  const put = await timed("r2.put.small", () =>
    client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: "text/plain",
        ContentLength: body.length,
      }),
    ),
  );

  const del = await timed("r2.delete", () =>
    client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    ),
  );

  console.log("\n=== Production R2 latency ===\n");
  console.log(`${put.label.padEnd(20)} ${put.ms} ms`);
  console.log(`${del.label.padEnd(20)} ${del.ms} ms`);
  console.log(
    `\nDocument/payment delete was blocking on delete (~${del.ms} ms) before deferral.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
