import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';

function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  if (STRIPE_SECRET_KEY.startsWith('rk_')) return null;
  return new Stripe(STRIPE_SECRET_KEY);
}

function getStripeError() {
  if (!STRIPE_SECRET_KEY) return 'Stripe is not configured (missing STRIPE_SECRET_KEY)';
  if (STRIPE_SECRET_KEY.startsWith('rk_'))
    return 'Stripe is misconfigured: use a secret key (sk_test_* or sk_live_*)';
  return null;
}

export async function POST(request: NextRequest) {
  const stripeError = getStripeError();
  if (stripeError) {
    return NextResponse.json({ ok: false, error: stripeError }, { status: 503 });
  }
  const stripe = getStripe()!;

  try {
    const payload = await request.json();
    const amountCents = Math.round(Number(payload.amountCents));
    const currency = String(payload.currency ?? 'usd').toLowerCase();
    const description = String(payload.description ?? 'BookingCart booking').slice(0, 120);
    const bookingRef = String(payload.bookingRef ?? '').trim();
    const successPath = String(payload.successPath ?? '/confirmation');
    const cancelPath = String(payload.cancelPath ?? '/payment');
    const customerEmail = String(payload.customerEmail ?? '').trim().toLowerCase();

    if (!Number.isFinite(amountCents) || amountCents < 50) {
      return NextResponse.json({ ok: false, error: 'Invalid amountCents' }, { status: 400 });
    }

    const origin =
      request.headers.get('origin') ??
      (() => {
        const host = request.headers.get('host') ?? '';
        const proto = request.headers.get('x-forwarded-proto') ?? 'https';
        return host ? `${proto}://${host}` : '';
      })();

    if (!origin) {
      return NextResponse.json(
        { ok: false, error: 'Unable to determine site origin' },
        { status: 500 },
      );
    }

    const successSep = successPath.includes('?') ? '&' : '?';
    const cancelSep = cancelPath.includes('?') ? '&' : '?';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: description },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail || undefined,
      client_reference_id: bookingRef || undefined,
      metadata: bookingRef ? { bookingRef } : undefined,
      success_url: `${origin}${successPath}${successSep}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}${cancelSep}canceled=1`,
    });

    return NextResponse.json({ ok: true, id: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Unable to create checkout session' },
      { status: 500 },
    );
  }
}
