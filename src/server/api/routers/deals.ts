import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { db } from '@/db';
import { flightDeals, adminAudit } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const dealsRouter = router({
  // Public — active deals ordered by sortOrder (for homepage)
  list: publicProcedure.query(async () => {
    const deals = await db
      .select()
      .from(flightDeals)
      .where(eq(flightDeals.active, true))
      .orderBy(asc(flightDeals.sortOrder), asc(flightDeals.origin));
    return { deals };
  }),

  // Admin — all deals (active + inactive)
  listAll: adminProcedure.query(async () => {
    const deals = await db
      .select()
      .from(flightDeals)
      .orderBy(asc(flightDeals.origin), asc(flightDeals.sortOrder));
    return { deals };
  }),

  // Admin — create or update a deal
  upsert: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        origin: z.string().min(1).max(10).toUpperCase(),
        destination: z.string().min(1).max(10).toUpperCase(),
        city: z.string().min(1),
        country: z.string().min(1),
        imageUrl: z.string().url().optional().nullable(),
        active: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
      }),
    )
    .mutation(async ({ input }) => {
      const now = new Date();
      const id = input.id ?? randomUUID();

      const existing = input.id
        ? await db.query.flightDeals.findFirst({ where: eq(flightDeals.id, input.id) })
        : null;

      if (existing) {
        await db
          .update(flightDeals)
          .set({
            origin: input.origin,
            destination: input.destination,
            city: input.city,
            country: input.country,
            imageUrl: input.imageUrl ?? null,
            active: input.active,
            sortOrder: input.sortOrder,
            updatedAt: now,
          })
          .where(eq(flightDeals.id, input.id!));
      } else {
        await db.insert(flightDeals).values({
          id,
          origin: input.origin,
          destination: input.destination,
          city: input.city,
          country: input.country,
          imageUrl: input.imageUrl ?? null,
          active: input.active,
          sortOrder: input.sortOrder,
          createdAt: now,
          updatedAt: now,
        });
      }

      return { id };
    }),

  // Admin — delete a deal
  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(flightDeals).where(eq(flightDeals.id, input.id));

      await db.insert(adminAudit).values({
        id: randomUUID(),
        adminId: ctx.session.user.id,
        action: 'deal.delete',
        targetId: input.id,
        event: { id: input.id },
      });

      return { ok: true };
    }),

  // Admin — toggle active status
  toggleActive: adminProcedure
    .input(z.object({ id: z.string().min(1), active: z.boolean() }))
    .mutation(async ({ input }) => {
      await db
        .update(flightDeals)
        .set({ active: input.active, updatedAt: new Date() })
        .where(eq(flightDeals.id, input.id));
      return { ok: true };
    }),
});
