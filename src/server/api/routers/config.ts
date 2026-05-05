import { router, publicProcedure } from '../trpc';

export const configRouter = router({
  get: publicProcedure.query(() => {
    return { googleClientId: '' };
  }),
});
