import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { bookings, adminAudit } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { randomUUID } from 'crypto';

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getAdminSession(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.role === 'admin' ? session : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, booking, email, id, status } = body ?? {};

    // ── save ──────────────────────────────────────────────────────────────────
    if (action === 'save') {
      if (!booking?.ref) {
        return NextResponse.json({ ok: false, error: 'Missing booking' }, { status: 400 });
      }

      const now = new Date();
      const existing = await db.query.bookings.findFirst({
        where: eq(bookings.ref, String(booking.ref)),
      });

      if (existing) {
        await db
          .update(bookings)
          .set({
            status: booking.status ?? existing.status,
            route: booking.route,
            dates: booking.dates,
            flight: booking.flight,
            passengers: booking.passengers,
            contact: booking.contact,
            extras: booking.extras,
            total: booking.total,
            payment: booking.payment ?? null,
            updatedAt: now,
          })
          .where(eq(bookings.ref, String(booking.ref)));
      } else {
        await db.insert(bookings).values({
          id: randomUUID(),
          ref: String(booking.ref),
          status: booking.status ?? 'new',
          route: booking.route,
          dates: booking.dates,
          flight: booking.flight,
          passengers: booking.passengers,
          contact: booking.contact,
          extras: booking.extras,
          total: booking.total,
          payment: booking.payment ?? null,
          createdAt: now,
          updatedAt: now,
        });
      }

      return NextResponse.json({ ok: true, id: booking.ref });
    }

    // ── list (admin only) ─────────────────────────────────────────────────────
    if (action === 'list') {
      const adminSession = await getAdminSession(request);
      if (!adminSession) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      const all = await db.query.bookings.findMany({
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });
      return NextResponse.json({ ok: true, bookings: all });
    }

    // ── lookup (authenticated user, own bookings) ─────────────────────────────
    if (action === 'lookup') {
      if (!email) {
        return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });
      }
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      if (session.user.email.toLowerCase() !== String(email).trim().toLowerCase()) {
        return NextResponse.json(
          { ok: false, error: 'Email does not match signed-in account' },
          { status: 403 },
        );
      }

      const found = await db.query.bookings.findMany({
        where: (t) => ilike((t.contact as any), `%"email":"${String(email).trim()}"%`),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });
      return NextResponse.json({ ok: true, bookings: found });
    }

    // ── status update (admin only) ────────────────────────────────────────────
    if (action === 'status') {
      const adminSession = await getAdminSession(request);
      if (!adminSession) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      if (!id || !status) {
        return NextResponse.json({ ok: false, error: 'Missing id or status' }, { status: 400 });
      }
      await db
        .update(bookings)
        .set({ status: String(status), updatedAt: new Date() })
        .where(eq(bookings.id, String(id)));
      await db.insert(adminAudit).values({
        id: randomUUID(),
        action: 'status_update',
        event: { action: 'status_update', bookingId: id, status },
      });
      return NextResponse.json({ ok: true });
    }

    // ── upload ticket (admin only) ────────────────────────────────────────────
    if (action === 'upload') {
      const adminSession = await getAdminSession(request);
      if (!adminSession) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      const { ticketUrl, ticketNumber, ticketAirline } = body;
      await db
        .update(bookings)
        .set({
          ticketUrl: ticketUrl ?? null,
          ticketNumber: ticketNumber ?? null,
          ticketAirline: ticketAirline ?? null,
          status: 'ticket_issued',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, String(id)));
      return NextResponse.json({ ok: true });
    }

    // ── cancel ────────────────────────────────────────────────────────────────
    if (action === 'cancel') {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      if (!id) {
        return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
      }
      const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, String(id)) });
      if (!booking) {
        return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
      }
      // Allow admin or the booking owner
      const contact = (booking.contact as any) ?? {};
      const isOwner = contact?.email?.toLowerCase() === session.user.email.toLowerCase();
      const isAdmin = session.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
      }
      await db
        .update(bookings)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(bookings.id, String(id)));
      return NextResponse.json({ ok: true });
    }

    // ── delete (admin only) ───────────────────────────────────────────────────
    if (action === 'delete') {
      const adminSession = await getAdminSession(request);
      if (!adminSession) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      if (!id) {
        return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
      }
      await db.delete(bookings).where(eq(bookings.id, String(id)));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('/api/bookings error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/bookings — returns the signed-in user's own bookings
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const email = session.user.email.toLowerCase();
    const all = await db.query.bookings.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    const mine = all.filter((b) => {
      const contact = (b.contact as any) ?? {};
      return contact?.email?.toLowerCase() === email;
    });
    return NextResponse.json({ ok: true, bookings: mine });
  } catch (err) {
    console.error('/api/bookings GET error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/bookings?id=xxx  { status } — admin status update (used by AdminPage)
export async function PATCH(request: NextRequest) {
  try {
    const adminSession = await getAdminSession(request);
    if (!adminSession) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    const body = await request.json();
    const { status, ticketUrl, ticketNumber, ticketAirline } = body ?? {};

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateData.status = String(status);
    if (ticketUrl !== undefined) updateData.ticketUrl = ticketUrl ?? null;
    if (ticketNumber !== undefined) updateData.ticketNumber = ticketNumber ?? null;
    if (ticketAirline !== undefined) updateData.ticketAirline = ticketAirline ?? null;

    await db.update(bookings).set(updateData).where(eq(bookings.id, String(id)));

    await db.insert(adminAudit).values({
      id: randomUUID(),
      adminId: adminSession.user.id,
      action: 'booking.status_update',
      targetId: String(id),
      event: { status, ticketUrl, ticketNumber },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('/api/bookings PATCH error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
