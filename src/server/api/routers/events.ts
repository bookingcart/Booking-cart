import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { fetchEventbriteEvents, fetchTicketmasterEvents, eventsConfigured } from '@/lib/events';

export const eventsRouter = router({
  search: publicProcedure
    .input(z.object({ location: z.string().min(1) }))
    .query(async ({ input }) => {
      const result = await fetchEventbriteEvents(input.location.trim());
      if (!result.ok) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error as string });
      }
      return { events: result.events };
    }),

  searchCombined: publicProcedure
    .input(z.object({ location: z.string().min(1) }))
    .query(async ({ input }) => {
      const location = input.location.trim();
      const [eb, tm] = await Promise.all([
        eventsConfigured.eventbrite
          ? fetchEventbriteEvents(location)
          : Promise.resolve({ ok: false, events: [] as any[] }),
        eventsConfigured.ticketmaster
          ? fetchTicketmasterEvents(location)
          : Promise.resolve({ ok: false, events: [] as any[] }),
      ]);

      const combined: any[] = [];
      const seen = new Set<string>();
      for (const e of [...(eb.events ?? []), ...(tm.events ?? [])]) {
        const key = String(e?.url ?? e?.id ?? '').trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          combined.push(e);
        }
      }

      return { events: combined };
    }),

  ticketmaster: publicProcedure
    .input(z.object({ location: z.string().min(1) }))
    .query(async ({ input }) => {
      const result = await fetchTicketmasterEvents(input.location.trim());
      if (!result.ok) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error as string });
      }
      return { events: result.events };
    }),

  status: publicProcedure.query(() => {
    return {
      eventbrite: eventsConfigured.eventbrite,
      ticketmaster: eventsConfigured.ticketmaster,
    };
  }),
});
