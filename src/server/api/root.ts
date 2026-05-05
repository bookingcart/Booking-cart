import { router } from './trpc';
import { airportsRouter } from './routers/airports';
import { flightsRouter } from './routers/flights';
import { bookingsRouter } from './routers/bookings';
import { eventsRouter } from './routers/events';
import { stripeRouter } from './routers/stripe';
import { userRouter } from './routers/user';
import { visaRouter } from './routers/visa';
import { auditRouter } from './routers/audit';
import { configRouter } from './routers/config';
import { dealsRouter } from './routers/deals';
import { settingsRouter } from './routers/settings';

export const appRouter = router({
  airports: airportsRouter,
  flights: flightsRouter,
  bookings: bookingsRouter,
  events: eventsRouter,
  stripe: stripeRouter,
  user: userRouter,
  visa: visaRouter,
  audit: auditRouter,
  config: configRouter,
  deals: dealsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
