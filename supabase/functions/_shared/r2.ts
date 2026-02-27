import { S3Client, GetObjectCommand, PutObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const mustGetEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
};

export const getR2BucketName = () => mustGetEnv("R2_BUCKET_NAME");

export const createR2Client = () => {
  const accountId = mustGetEnv("R2_ACCOUNT_ID");
  const accessKeyId = mustGetEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = mustGetEnv("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
};

export const signR2PutObject = async (args: {
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
}) => {
  const client = createR2Client();
  const bucket = getR2BucketName();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: args.key,
    ContentType: args.contentType || "application/octet-stream",
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: args.expiresInSeconds ?? 600 });
  return { uploadUrl, bucket };
};

export const signR2GetObject = async (args: { key: string; expiresInSeconds?: number }) => {
  const client = createR2Client();
  const bucket = getR2BucketName();
  const command = new GetObjectCommand({ Bucket: bucket, Key: args.key });
  const url = await getSignedUrl(client, command, { expiresIn: args.expiresInSeconds ?? 600 });
  return { url, bucket };
};

