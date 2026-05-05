import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    // No Google client ID — we now use better-auth
    googleClientId: '',
  });
}
