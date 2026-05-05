import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
import { users, adminAudit } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const userRouter = router({
  count: adminProcedure.query(async () => {
    const result = await db.select().from(users);
    return { count: result.length };
  }),

  list: adminProcedure.query(async () => {
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
    return { users: all };
  }),

  profile: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      if (ctx.session.user.email.toLowerCase() !== email) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const user = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return { user };
    }),

  update: protectedProcedure
    .input(z.object({ name: z.string().optional(), image: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.image !== undefined) updateData.image = input.image;
      if (Object.keys(updateData).length > 1) {
        await db.update(users).set(updateData).where(eq(users.id, ctx.session.user.id));
      }
      return { ok: true };
    }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    await db.delete(users).where(eq(users.email, ctx.session.user.email));
    return { ok: true };
  }),

  adminAction: adminProcedure
    .input(
      z.object({
        action: z.enum(['ban', 'unban', 'setRole']),
        userId: z.string().min(1),
        reason: z.string().optional(),
        role: z.enum(['admin', 'user']).optional(),
        banExpires: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      let auditAction = '';

      if (input.action === 'ban') {
        updateData.banned = true;
        updateData.banReason = input.reason ?? null;
        updateData.banExpires = input.banExpires ? new Date(input.banExpires) : null;
        auditAction = 'user.ban';
      } else if (input.action === 'unban') {
        updateData.banned = false;
        updateData.banReason = null;
        updateData.banExpires = null;
        auditAction = 'user.unban';
      } else if (input.action === 'setRole') {
        if (!input.role) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'role is required for setRole' });
        }
        updateData.role = input.role;
        auditAction = 'user.setRole';
      }

      await db.update(users).set(updateData).where(eq(users.id, input.userId));

      await db.insert(adminAudit).values({
        id: randomUUID(),
        adminId: ctx.session.user.id,
        action: auditAction,
        targetId: input.userId,
        event: { action: input.action, reason: input.reason, role: input.role, banExpires: input.banExpires },
      });

      return { ok: true };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({ where: eq(users.id, ctx.session.user.id) });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    return { user };
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        homeAirport: z.string().optional(),
        cabin: z.string().optional(),
        seat: z.string().optional(),
        meal: z.string().optional(),
        airlines: z.array(z.string()).optional(),
        phone: z.string().optional(),
        phoneCode: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(users)
        .set({ preferences: input, updatedAt: new Date() })
        .where(eq(users.id, ctx.session.user.id));
      return { ok: true };
    }),

  updateNotifications: protectedProcedure
    .input(
      z.object({
        email: z
          .object({
            bookingConfirm: z.boolean(),
            flightUpdates: z.boolean(),
            deals: z.boolean(),
            newsletter: z.boolean(),
          })
          .optional(),
        sms: z
          .object({
            boardingAlert: z.boolean(),
            flightDelay: z.boolean(),
            promos: z.boolean(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(users)
        .set({ notifications: input, updatedAt: new Date() })
        .where(eq(users.id, ctx.session.user.id));
      return { ok: true };
    }),
});
