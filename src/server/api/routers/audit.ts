import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { db } from '@/db';
import { adminAudit, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const auditRouter = router({
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      }).optional(),
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

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

      return { logs: rows, limit, offset };
    }),
});
