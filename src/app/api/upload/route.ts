import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';

async function getAdminSession(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.role === 'admin' ? session : null;
}

// POST /api/upload
// Body: multipart/form-data  { file: File, bookingId?: string }
// Returns: { ok: true, url: string }
export async function POST(request: NextRequest) {
  try {
  const adminSession = await getAdminSession(request);
  if (!adminSession) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  const bookingId = (formData.get('bookingId') as string | null) ?? 'misc';

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
  }

  // 10 MB limit
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: 'File too large (max 10 MB)' }, { status: 413 });
  }

  const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') ?? 'bin';
  const key = `tickets/${bookingId}/${randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const client = getR2Client();
  const bucket = R2_BUCKET();
  const publicUrl = R2_PUBLIC_URL();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: file.type || 'application/octet-stream',
      ContentDisposition: `attachment; filename="${file.name}"`,
    }),
  );

  // If a public CDN / custom domain is configured, return a permanent URL.
  // Otherwise generate a 7-day presigned GET URL.
  let url: string;
  if (publicUrl) {
    url = `${publicUrl.replace(/\/$/, '')}/${key}`;
  } else {
    url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
    );
  }

  return NextResponse.json({ ok: true, url, key });
  } catch (err) {
    console.error('/api/upload error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
