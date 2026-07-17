import { HeadObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const paymentId = "0c4f9f95-aa81-44ca-83db-c65996e3d8";
const transactionId = "7a144ebc-81dc-43d6-8df8-d06ca7f7975d";
const keys = [
  `receipts/${transactionId}/${paymentId}.pdf`,
  `receipts/${transactionId}/${paymentId}`,
];

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("R2 env incomplete");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

for (const key of keys) {
  try {
    const head = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    console.log("HEAD OK", key, "type=", head.ContentType, "bytes=", head.ContentLength);
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 60 },
    );
    const res = await fetch(url);
    console.log("GET signed", key, "status=", res.status, "type=", res.headers.get("content-type"));
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    console.log("FAIL", key, "status=", status, "name=", error?.name);
  }
}
