import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';

function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  if (STRIPE_SECRET_KEY.startsWith('rk_')) return null;
  return new Stripe(STRIPE_SECRET_KEY);
}

function stripeConfigError() {
  if (!STRIPE_SECRET_KEY) return 'Stripe is not configured (missing STRIPE_SECRET_KEY)';
  if (STRIPE_SECRET_KEY.startsWith('rk_'))
    return 'Stripe is misconfigured: use a secret key (sk_test_* or sk_live_*)';
  return null;
}

export const stripeRouter = router({
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        amountCents: z.number().int().min(50),
        currency: z.string().default('usd'),
        description: z.string().max(120).default('BookingCart booking'),
        bookingRef: z.string().optional().default(''),
        successPath: z.string().default('/confirmation'),
        cancelPath: z.string().default('/payment'),
        customerEmail: z.string().email().optional().or(z.literal('')),
        origin: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const configErr = stripeConfigError();
      if (configErr) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: configErr });
      }
      const stripe = getStripe()!;

      const origin = input.origin ?? process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
      if (!origin) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to determine site origin' });
      }

      const successSep = input.successPath.includes('?') ? '&' : '?';
      const cancelSep = input.cancelPath.includes('?') ? '&' : '?';

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: input.currency,
              product_data: { name: input.description },
              unit_amount: input.amountCents,
            },
            quantity: 1,
          },
        ],
        customer_email: input.customerEmail || undefined,
        client_reference_id: input.bookingRef || undefined,
        metadata: input.bookingRef ? { bookingRef: input.bookingRef } : undefined,
        success_url: `${origin}${input.successPath}${successSep}session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${input.cancelPath}${cancelSep}canceled=1`,
      });

      return { id: session.id, url: session.url };
    }),

  getSession: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      const stripe = getStripe();
      if (!stripe) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Stripe is not configured' });
      }

      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      return {
        session: {
          id: session.id,
          status: session.status,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_email,
          client_reference_id: session.client_reference_id,
          metadata: session.metadata ?? {},
        },
      };
    }),
});
