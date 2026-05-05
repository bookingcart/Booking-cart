import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
import { bookings, adminAudit } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const bookingsRouter = router({
  // Public — save or update a booking
  save: publicProcedure
    .input(
      z.object({
        booking: z.object({
          ref: z.string().min(1),
          status: z.string().optional(),
          route: z.string().optional(),
          dates: z.record(z.string(), z.unknown()).optional(),
          flight: z.record(z.string(), z.unknown()).optional(),
          passengers: z.array(z.record(z.string(), z.unknown())).optional(),
          contact: z.record(z.string(), z.unknown()).optional(),
          extras: z.record(z.string(), z.unknown()).optional(),
          total: z.number().optional(),
          payment: z.record(z.string(), z.unknown()).optional().nullable(),
          paymentIntentId: z.string().optional().nullable(),
          userId: z.string().optional().nullable(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const { booking } = input;
      const now = new Date();

      const existing = await db.query.bookings.findFirst({
        where: eq(bookings.ref, booking.ref),
      });

      if (existing) {
        // Only update fields that were explicitly provided (undefined = skip)
        await db
          .update(bookings)
          .set({
            ...(booking.status !== undefined && { status: booking.status }),
            ...(booking.route !== undefined && { route: booking.route }),
            ...(booking.dates !== undefined && { dates: booking.dates as any }),
            ...(booking.flight !== undefined && { flight: booking.flight as any }),
            ...(booking.passengers !== undefined && { passengers: booking.passengers as any }),
            ...(booking.contact !== undefined && { contact: booking.contact as any }),
            ...(booking.extras !== undefined && { extras: booking.extras as any }),
            ...(booking.total !== undefined && { total: booking.total }),
            ...(booking.payment !== undefined && { payment: booking.payment ?? null }),
            ...(booking.paymentIntentId !== undefined && { paymentIntentId: booking.paymentIntentId ?? null }),
            // Only set userId if not already set (first-time link)
            ...(booking.userId && !existing.userId && { userId: booking.userId }),
            updatedAt: now,
          })
          .where(eq(bookings.ref, booking.ref));
      } else {
        await db.insert(bookings).values({
          id: randomUUID(),
          ref: booking.ref,
          status: booking.status ?? 'new',
          route: booking.route,
          dates: booking.dates as any,
          flight: booking.flight as any,
          passengers: booking.passengers as any,
          contact: booking.contact as any,
          extras: booking.extras as any,
          total: booking.total,
          payment: booking.payment ?? null,
          paymentIntentId: booking.paymentIntentId ?? null,
          userId: booking.userId ?? null,
          createdAt: now,
          updatedAt: now,
        });
      }

      return { id: booking.ref };
    }),

  // Admin — get single booking by id
  getById: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      });
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND' });
      return { booking };
    }),

  // Admin — list all bookings
  list: adminProcedure.query(async () => {
    const all = await db.query.bookings.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    return { bookings: all };
  }),

  // Authenticated user — look up own bookings by email
  lookup: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const sessionEmail = ctx.session.user.email.toLowerCase();
      if (sessionEmail !== input.email.trim().toLowerCase()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Email does not match signed-in account' });
      }
      const found = await db.query.bookings.findMany({
        where: (t) => ilike(t.contact as any, `%"email":"${input.email.trim()}"%`),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });
      return { bookings: found };
    }),

  // Authenticated user — own bookings via session
  myBookings: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const email = ctx.session.user.email.toLowerCase();

    // Fetch by userId (bookings linked at booking time) OR by contact email
    const all = await db.query.bookings.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    const mine = all.filter((b) => {
      if (b.userId === userId) return true;
      const contact = (b.contact as any) ?? {};
      return contact?.email?.toLowerCase() === email;
    });
    return { bookings: mine };
  }),

  // Admin — update booking status
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        status: z.string().min(1),
        ticketUrl: z.string().optional().nullable(),
        ticketNumber: z.string().optional().nullable(),
        ticketAirline: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.status) updateData.status = input.status;
      if (input.ticketUrl !== undefined) updateData.ticketUrl = input.ticketUrl ?? null;
      if (input.ticketNumber !== undefined) updateData.ticketNumber = input.ticketNumber ?? null;
      if (input.ticketAirline !== undefined) updateData.ticketAirline = input.ticketAirline ?? null;

      await db.update(bookings).set(updateData).where(eq(bookings.id, input.id));

      await db.insert(adminAudit).values({
        id: randomUUID(),
        adminId: ctx.session.user.id,
        action: 'booking.status_update',
        targetId: input.id,
        event: { status: input.status, ticketUrl: input.ticketUrl, ticketNumber: input.ticketNumber },
      });

      return { ok: true };
    }),

  // Admin — attach ticket details (marks status as ticket_issued)
  uploadTicket: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        ticketUrl: z.string().optional().nullable(),
        ticketNumber: z.string().optional().nullable(),
        ticketAirline: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .update(bookings)
        .set({
          ticketUrl: input.ticketUrl ?? null,
          ticketNumber: input.ticketNumber ?? null,
          ticketAirline: input.ticketAirline ?? null,
          status: 'ticket_issued',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, input.id));
      return { ok: true };
    }),

  // Authenticated owner or admin — cancel a booking
  cancel: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, input.id) });
      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const contact = (booking.contact as any) ?? {};
      const isOwner = contact?.email?.toLowerCase() === ctx.session.user.email.toLowerCase();
      const isAdmin = ctx.session.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      await db
        .update(bookings)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(bookings.id, input.id));
      return { ok: true };
    }),

  // Admin — delete a booking permanently
  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await db.delete(bookings).where(eq(bookings.id, input.id));
      return { ok: true };
    }),

  // Public — get a booking by ref or Stripe payment intent (session_id)
  getByRef: publicProcedure
    .input(z.object({ ref: z.string().optional(), sessionId: z.string().optional() }))
    .query(async ({ input }) => {
      const { ref, sessionId } = input;
      if (!ref && !sessionId) return { booking: null };

      let booking = null;
      if (ref) {
        booking = await db.query.bookings.findFirst({ where: eq(bookings.ref, ref) });
      }
      if (!booking && sessionId) {
        booking = await db.query.bookings.findFirst({ where: eq(bookings.paymentIntentId, sessionId) });
      }
      return { booking };
    }),

  // Admin — get all bookings for a specific user
  byUser: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const all = await db.query.bookings.findMany({
        where: eq(bookings.userId, input.userId),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });
      return { bookings: all };
    }),

  // Protected — get a single booking the authenticated user owns
  getOwned: protectedProcedure
    .input(z.object({ ref: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.ref, input.ref),
      });
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
      const email = ctx.session.user.email.toLowerCase();
      const contact = (booking.contact as any) ?? {};
      const isOwner =
        booking.userId === ctx.session.user.id ||
        contact?.email?.toLowerCase() === email;
      if (!isOwner) throw new TRPCError({ code: 'FORBIDDEN' });
      return { booking };
    }),
});
