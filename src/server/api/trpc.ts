import { initTRPC, TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '@/lib/auth';
import { db } from '@/db';

// ─── Context ──────────────────────────────────────────────────────────────────

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({ headers: opts.req.headers });
  return { session, db };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// ─── tRPC initialisation ─────────────────────────────────────────────────────

const t = initTRPC.context<Context>().create();

// ─── Reusable base pieces ────────────────────────────────────────────────────

export const router = t.router;
export const publicProcedure = t.procedure;

// ─── Auth middleware ──────────────────────────────────────────────────────────

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

const enforceAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (ctx.session.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const protectedProcedure = t.procedure.use(enforceAuth);
export const adminProcedure = t.procedure.use(enforceAdmin);
