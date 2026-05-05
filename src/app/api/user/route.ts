import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, adminAudit } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function getSession(request: NextRequest) {
  return auth.api.getSession({ headers: request.headers });
}

// GET /api/user?action=count  (admin)
// GET /api/user?action=list   (admin)
// GET /api/user?email=xxx      (authenticated, own profile)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'count') {
      const session = await getSession(request);
      if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      const result = await db.select().from(users);
      return NextResponse.json({ ok: true, count: result.length });
    }

    if (action === 'list') {
      const session = await getSession(request);
      if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      const all = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          banned: users.banned,
          banReason: users.banReason,
          banExpires: users.banExpires,
          createdAt: users.createdAt,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
      return NextResponse.json({ ok: true, users: all });
    }

    const email = searchParams.get('email')?.trim().toLowerCase() ?? '';
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });
    }

    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.email.toLowerCase() !== email) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error('/api/user GET error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user — upsert profile state
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { state } = body ?? {};
    const email = session.user.email;

    // Update user name/image from state if provided
    if (state?.name || state?.image) {
      await db
        .update(users)
        .set({
          name: state.name ?? session.user.name,
          image: state.image ?? session.user.image,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('/api/user POST error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/user — delete own account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    await db.delete(users).where(eq(users.email, session.user.email));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('/api/user DELETE error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/user — admin: ban/unban/setRole
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, reason, role, banExpires } = body ?? {};

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    let auditAction = '';

    if (action === 'ban') {
      updateData.banned = true;
      updateData.banReason = reason ?? null;
      updateData.banExpires = banExpires ? new Date(banExpires) : null;
      auditAction = 'user.ban';
    } else if (action === 'unban') {
      updateData.banned = false;
      updateData.banReason = null;
      updateData.banExpires = null;
      auditAction = 'user.unban';
    } else if (action === 'setRole') {
      if (role !== 'admin' && role !== 'user') {
        return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 });
      }
      updateData.role = role;
      auditAction = 'user.setRole';
    } else {
      return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
    }

    await db.update(users).set(updateData).where(eq(users.id, String(userId)));

    await db.insert(adminAudit).values({
      id: randomUUID(),
      adminId: session.user.id,
      action: auditAction,
      targetId: String(userId),
      event: { action, reason, role, banExpires },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('/api/user PATCH error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
