import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { db } from '@/db';
import { visaApplications, adminAudit } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const visaRouter = router({
  list: protectedProcedure
    .input(z.object({ admin: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const isAdmin = input?.admin === true && ctx.session.user.role === 'admin';

      if (isAdmin) {
        const all = await db
          .select()
          .from(visaApplications)
          .orderBy(desc(visaApplications.createdAt));
        return { applications: all };
      }

      const own = await db
        .select()
        .from(visaApplications)
        .where(eq(visaApplications.userId, ctx.session.user.id))
        .orderBy(desc(visaApplications.createdAt));
      return { applications: own };
    }),

  submit: protectedProcedure
    .input(
      z.object({
        passport: z.string().min(1),
        destination: z.string().min(1),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await db.insert(visaApplications).values({
        id: randomUUID(),
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email,
        passport: input.passport,
        destination: input.destination,
        notes: input.notes ?? null,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      return { ok: true };
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        status: z.string().min(1),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(visaApplications)
        .set({ status: input.status, notes: input.notes ?? null, updatedAt: new Date() })
        .where(eq(visaApplications.id, input.id));

      await db.insert(adminAudit).values({
        id: randomUUID(),
        adminId: ctx.session.user.id,
        action: 'visa.status_update',
        targetId: input.id,
        event: { status: input.status, notes: input.notes },
      });

      return { ok: true };
    }),
});
