import { S3Client } from '@aws-sdk/client-s3';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing environment variable: ${name}`);
  return val;
}

// Lazy singleton — throws at call time, not at module load time.
let _client: S3Client | null = null;
export function getR2Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${requireEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
        secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
      },
    });
  }
  return _client;
}

export const R2_BUCKET = () => requireEnv('R2_BUCKET_NAME');
export const R2_PUBLIC_URL = () => process.env.R2_PUBLIC_URL ?? null;
