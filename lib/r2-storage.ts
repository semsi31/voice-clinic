import "server-only";

import { randomUUID } from "crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string | null;
};

type UploadFileToR2Params = {
  key: string;
  body: Buffer;
  contentType?: string;
  contentLength?: number;
};

let cachedClient: S3Client | null = null;

function readR2Config(): R2Config {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.trim() || null;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Cloudflare R2 environment variables are not configured.");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl,
  };
}

export function getR2Client() {
  if (cachedClient) {
    return cachedClient;
  }

  const config = readR2Config();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedClient;
}

function getR2BucketName() {
  return readR2Config().bucketName;
}

function sanitizeKeyPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function buildR2Key(...parts: string[]) {
  return parts
    .map((part) => sanitizeKeyPart(part))
    .filter(Boolean)
    .join("/");
}

export async function uploadFileToR2({
  key,
  body,
  contentType,
  contentLength,
}: UploadFileToR2Params) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream",
      ContentLength: contentLength ?? body.length,
    }),
  );
}

export async function deleteFileFromR2(key: string) {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
  );
}

export async function createR2SignedDownloadUrl(
  key: string,
  expiresInSeconds = 300,
) {
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
    { expiresIn: expiresInSeconds },
  );
}

export async function headR2Object(key: string) {
  return getR2Client().send(
    new HeadObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
  );
}

export async function getR2Object(key: string) {
  return getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
  );
}

export async function r2ObjectExists(key: string) {
  try {
    await headR2Object(key);
    return true;
  } catch (error) {
    const status = (error as { name?: string; $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if ((error as { name?: string }).name === "NotFound" || status === 404) {
      return false;
    }
    throw error;
  }
}

export function buildDocumentR2Key(fileName: string, id = randomUUID()) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return buildR2Key("documents", year, month, `${id}-${fileName}`);
}

export function buildReceiptR2Key(transactionId: string, paymentId: string) {
  return buildR2Key("receipts", transactionId, `${paymentId}.pdf`);
}
