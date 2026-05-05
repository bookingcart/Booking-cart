import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { adminAudit, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// GET /api/audit?limit=50&offset=0 — admin only
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Fetch audit rows with admin user email via a join
    const rows = await db
      .select({
        id: adminAudit.id,
        action: adminAudit.action,
        targetId: adminAudit.targetId,
        event: adminAudit.event,
        createdAt: adminAudit.createdAt,
        adminId: adminAudit.adminId,
        adminEmail: users.email,
        adminName: users.name,
      })
      .from(adminAudit)
      .leftJoin(users, eq(adminAudit.adminId, users.id))
      .orderBy(desc(adminAudit.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ ok: true, logs: rows, limit, offset });
  } catch (err) {
    console.error('/api/audit GET error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
