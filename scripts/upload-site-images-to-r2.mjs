/**
 * Upload site images from public/images to Cloudflare R2 under images/.
 * Usage: node --env-file=.env.local scripts/upload-site-images-to-r2.mjs
 */
import { createReadStream, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import {
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

const accountId = requireEnv("CLOUDFLARE_R2_ACCOUNT_ID");
const accessKeyId = requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
const secretAccessKey = requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
const bucket = requireEnv("CLOUDFLARE_R2_BUCKET_NAME");
const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.trim() || "";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

const imagesDir = join(process.cwd(), "public", "images");
const files = readdirSync(imagesDir).filter((name) =>
  Object.keys(CONTENT_TYPES).includes(extname(name).toLowerCase()),
);

console.log(`Uploading ${files.length} files to r2://${bucket}/images/`);

const uploaded = [];
for (const name of files) {
  const filePath = join(imagesDir, name);
  const key = `images/${name}`;
  const body = readFileSync(filePath);
  const contentType = CONTENT_TYPES[extname(name).toLowerCase()] || "application/octet-stream";

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.length,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  // Verify object exists
  const head = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: key }),
  );

  uploaded.push({
    key,
    bytes: body.length,
    contentType: head.ContentType,
  });
  console.log(`OK ${key} (${body.length} bytes)`);
}

// List images/ prefix summary
const listed = await client.send(
  new ListObjectsV2Command({ Bucket: bucket, Prefix: "images/", MaxKeys: 100 }),
);

console.log(
  JSON.stringify(
    {
      uploadedCount: uploaded.length,
      listedCount: listed.KeyCount ?? 0,
      publicBaseConfigured: Boolean(publicBaseUrl),
      publicBaseValid: (() => {
        try {
          const u = new URL(publicBaseUrl);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      })(),
      sampleKeys: (listed.Contents ?? []).slice(0, 5).map((item) => item.Key),
    },
    null,
    2,
  ),
);
