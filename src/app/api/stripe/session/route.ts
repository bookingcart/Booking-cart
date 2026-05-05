import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';

function getStripe() {
  if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.startsWith('rk_')) return null;
  return new Stripe(STRIPE_SECRET_KEY);
}

export async function GET(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: 'Stripe is not configured' }, { status: 503 });
  }

  try {
    const sessionId = new URL(request.url).searchParams.get('session_id')?.trim() ?? '';
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'Missing session_id' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      ok: true,
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
    });
  } catch (err: any) {
    console.error('Stripe session error:', err);
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Unable to load checkout session' },
      { status: 500 },
    );
  }
}
