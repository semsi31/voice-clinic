import { ListObjectsV2Command, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

const list = await client.send(
  new ListObjectsV2Command({ Bucket: bucket, Prefix: "receipts/", MaxKeys: 5 }),
);
console.log("objectCount", list.KeyCount, "isTruncated", list.IsTruncated);
for (const item of list.Contents ?? []) {
  console.log("keySuffix", item.Key?.slice(-20), "bytes", item.Size);
}

const dbSuffix = "96e3d8bd.pdf";
const match = (list.Contents ?? []).find((item) => item.Key?.endsWith(dbSuffix));
if (match?.Key) {
  const head = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: match.Key }),
  );
  console.log("matchedDbSuffix HEAD ok type=", head.ContentType);
} else {
  console.log("no object ending with db suffix", dbSuffix);
}
