import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { visaApplications, adminAudit } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function getSession(request: NextRequest) {
  return auth.api.getSession({ headers: request.headers });
}

// GET /api/visa/applications         — authenticated user: own applications
// GET /api/visa/applications?admin=1 — admin: all applications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === '1' && session.user.role === 'admin';

    if (isAdmin) {
      const all = await db
        .select()
        .from(visaApplications)
        .orderBy(desc(visaApplications.createdAt));
      return NextResponse.json({ ok: true, applications: all });
    }

    const own = await db
      .select()
      .from(visaApplications)
      .where(eq(visaApplications.userId, session.user.id))
      .orderBy(desc(visaApplications.createdAt));
    return NextResponse.json({ ok: true, applications: own });
  } catch (err) {
    console.error('/api/visa/applications GET error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/visa/applications — user submits an application
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { passport, destination, notes } = body ?? {};

    if (!passport || !destination) {
      return NextResponse.json(
        { ok: false, error: 'passport and destination are required' },
        { status: 400 },
      );
    }

    const now = new Date();
    await db.insert(visaApplications).values({
      id: randomUUID(),
      userId: session.user.id,
      userEmail: session.user.email,
      passport: String(passport),
      destination: String(destination),
      notes: notes ?? null,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('/api/visa/applications POST error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/visa/applications?id=xxx { status } — admin updates status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    const body = await request.json();
    const { status, notes } = body ?? {};

    if (!status) {
      return NextResponse.json({ ok: false, error: 'Missing status' }, { status: 400 });
    }

    await db
      .update(visaApplications)
      .set({ status: String(status), notes: notes ?? undefined, updatedAt: new Date() })
      .where(eq(visaApplications.id, String(id)));

    await db.insert(adminAudit).values({
      id: randomUUID(),
      adminId: session.user.id,
      action: 'visa.status_update',
      targetId: String(id),
      event: { status, notes },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('/api/visa/applications PATCH error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
