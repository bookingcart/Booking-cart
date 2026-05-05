import { NextRequest, NextResponse } from 'next/server';

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY ?? '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

// Simple in-memory cache (resets on cold start — acceptable for search results)
const searchCache = new Map<string, { data: Record<string, unknown>; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      travelClass = 'ECONOMY',
      max = 30,
    } = body ?? {};

    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      return NextResponse.json(
        { ok: false, error: 'Missing required parameters' },
        { status: 400 },
      );
    }

    if (!DUFFEL_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Flight search is not configured' },
        { status: 503 },
      );
    }

    const cacheKey = JSON.stringify({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
    });

    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ ok: true, ...cached.data, fromCache: true });
    }

    const slices: Array<{ origin: string; destination: string; departure_date: string }> = [
      { origin: originLocationCode, destination: destinationLocationCode, departure_date: departureDate },
    ];
    if (returnDate) {
      slices.push({
        origin: destinationLocationCode,
        destination: originLocationCode,
        departure_date: returnDate,
      });
    }

    const passengers: Array<{ type: string }> = [];
    for (let i = 0; i < Number(adults); i++) passengers.push({ type: 'adult' });
    for (let i = 0; i < Number(children); i++) passengers.push({ type: 'child' });
    for (let i = 0; i < Number(infants); i++) passengers.push({ type: 'infant_without_seat' });

    const cabinMap: Record<string, string> = {
      ECONOMY: 'economy', economy: 'economy',
      PREMIUM_ECONOMY: 'premium_economy',
      BUSINESS: 'business', business: 'business',
      FIRST: 'first', first: 'first',
    };
    const cabin = cabinMap[travelClass] ?? 'economy';

    const offerRequestResp = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        Authorization: `Bearer ${DUFFEL_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers,
          cabin_class: cabin,
          return_offers: false,
        },
      }),
    });

    if (!offerRequestResp.ok) {
      const errText = await offerRequestResp.text();
      console.error('Duffel offer_request error:', offerRequestResp.status, errText);
      return NextResponse.json({ ok: false, error: 'Flight search failed' }, { status: 502 });
    }

    const { data: offerRequest } = await offerRequestResp.json();
    const offerRequestId = offerRequest?.id;

    const offersResp = await fetch(
      `${DUFFEL_BASE_URL}/air/offers?offer_request_id=${offerRequestId}&limit=${max}&sort=total_amount`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Duffel-Version': 'v2',
          Authorization: `Bearer ${DUFFEL_API_KEY}`,
        },
      },
    );

    if (!offersResp.ok) {
      return NextResponse.json({ ok: false, error: 'Failed to retrieve offers' }, { status: 502 });
    }

    const { data: offers, meta } = await offersResp.json();
    const result = { offers: offers ?? [], meta: meta ?? {} };
    searchCache.set(cacheKey, { data: result, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('/api/duffel-search error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
