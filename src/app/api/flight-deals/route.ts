import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flightDeals } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY ?? '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

// In-memory cache (2 hours)
const dealsCache = new Map<string, { data: Record<string, unknown>; expiresAt: number }>();

const ROUTES: Record<string, Array<{ to: string; city: string; country: string; image: string }>> = {
  EBB: [
    { to: 'DXB', city: 'Dubai', country: 'UAE', image: 'dubai' },
    { to: 'LHR', city: 'London', country: 'UK', image: 'london' },
    { to: 'NBO', city: 'Nairobi', country: 'Kenya', image: 'nairobi' },
    { to: 'JNB', city: 'Johannesburg', country: 'South Africa', image: 'johannesburg' },
    { to: 'CAI', city: 'Cairo', country: 'Egypt', image: 'cairo' },
    { to: 'IST', city: 'Istanbul', country: 'Turkey', image: 'istanbul' },
  ],
  NBO: [
    { to: 'DXB', city: 'Dubai', country: 'UAE', image: 'dubai' },
    { to: 'LHR', city: 'London', country: 'UK', image: 'london' },
    { to: 'JNB', city: 'Johannesburg', country: 'South Africa', image: 'johannesburg' },
    { to: 'CDG', city: 'Paris', country: 'France', image: 'paris' },
    { to: 'BOM', city: 'Mumbai', country: 'India', image: 'mumbai' },
  ],
  DEFAULT: [
    { to: 'DXB', city: 'Dubai', country: 'UAE', image: 'dubai' },
    { to: 'LHR', city: 'London', country: 'UK', image: 'london' },
    { to: 'CDG', city: 'Paris', country: 'France', image: 'paris' },
    { to: 'JFK', city: 'New York', country: 'USA', image: 'new-york' },
    { to: 'SIN', city: 'Singapore', country: 'Singapore', image: 'singapore' },
    { to: 'BKK', city: 'Bangkok', country: 'Thailand', image: 'bangkok' },
  ],
};

const CITY_TO_IATA: Record<string, string> = {
  kampala: 'EBB', entebbe: 'EBB', nairobi: 'NBO', 'dar es salaam': 'DAR',
  johannesburg: 'JNB', 'cape town': 'CPT', lagos: 'LOS', london: 'LHR',
  paris: 'CDG', frankfurt: 'FRA', amsterdam: 'AMS', 'new york': 'JFK',
  dubai: 'DXB', singapore: 'SIN', sydney: 'SYD', tokyo: 'NRT', istanbul: 'IST',
};

const COUNTRY_TO_IATA: Record<string, string> = {
  Uganda: 'EBB', Kenya: 'NBO', Tanzania: 'DAR', 'South Africa': 'JNB',
  Nigeria: 'LOS', 'United Kingdom': 'LHR', France: 'CDG', Germany: 'FRA',
  Netherlands: 'AMS', 'United States': 'JFK', UAE: 'DXB', India: 'DEL',
  Singapore: 'SIN', Australia: 'SYD', Japan: 'NRT', Turkey: 'IST',
};

const DEST_IMAGES: Record<string, string> = {
  dubai: 'https://images.pexels.com/photos/325193/pexels-photo-325193.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  london: 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  paris: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'new-york': 'https://images.pexels.com/photos/290386/pexels-photo-290386.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  nairobi: 'https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  johannesburg: 'https://images.pexels.com/photos/259447/pexels-photo-259447.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  singapore: 'https://images.pexels.com/photos/777059/pexels-photo-777059.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  bangkok: 'https://images.pexels.com/photos/1682748/pexels-photo-1682748.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  istanbul: 'https://images.pexels.com/photos/2064827/pexels-photo-2064827.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
};
const FALLBACK_IMG = 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop';

function getNextDate(offsetDays = 30) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

async function fetchDeal(origin: string, dest: string, date: string) {
  if (!DUFFEL_API_KEY) return null;
  try {
    const resp = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DUFFEL_API_KEY}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        data: {
          slices: [{ origin, destination: dest, departure_date: date }],
          passengers: [{ type: 'adult' }],
          cabin_class: 'economy',
          max_connections: 1,
        },
      }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    const offers: any[] = json.data?.offers ?? [];
    if (!offers.length) return null;
    offers.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount));
    const best = offers[0];
    const slice = best.slices?.[0];
    const seg = slice?.segments?.[0];
    return {
      price: parseFloat(best.total_amount),
      currency: best.total_currency ?? 'USD',
      airline: seg?.marketing_carrier?.name ?? '',
      stops: slice ? slice.segments.length - 1 : 0,
      departTime: (seg?.departing_at ?? '').slice(11, 16),
      date,
      offerId: best.id,
    };
  } catch {
    return null;
  }
}

function mockDeal(index: number, date: string) {
  const prices = [180, 240, 320, 440, 560, 290];
  const airlines = ['Emirates', 'Qatar Airways', 'Turkish Airlines', 'British Airways', 'Air France', 'Kenya Airways'];
  return {
    price: prices[index % prices.length] + Math.floor(Math.random() * 40),
    currency: 'USD',
    airline: airlines[index % airlines.length],
    stops: index % 3 === 0 ? 0 : 1,
    departTime: '',
    date,
    offerId: null,
    isMock: true,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const overrideIata = searchParams.get('origin') ?? '';
  const clientCity = searchParams.get('city') ?? '';
  const clientCountry = searchParams.get('country') ?? '';

  const cacheKey = `deals_${overrideIata || clientCity || 'default'}`;
  const cached = dealsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ok: true, ...(cached.data as any), cached: true });
  }

  let iata = overrideIata;
  if (!iata && clientCity) iata = CITY_TO_IATA[clientCity.toLowerCase()] ?? '';
  if (!iata && clientCountry) iata = COUNTRY_TO_IATA[clientCountry] ?? '';
  if (!iata) {
    const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
    const isLocal = !ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.');
    if (!isLocal) {
      try {
        const geoResp = await fetch(`http://ip-api.com/json/${ip}?fields=city,country`, { signal: AbortSignal.timeout(3000) });
        if (geoResp.ok) {
          const geo = await geoResp.json();
          iata = CITY_TO_IATA[(geo.city ?? '').toLowerCase()] ?? COUNTRY_TO_IATA[geo.country ?? ''] ?? '';
        }
      } catch {}
    }
    if (!iata) iata = 'EBB';
  }

  // Build routes from DB (active deals) — fall back to hardcoded if DB is empty
  let routes: Array<{ to: string; city: string; country: string; image: string }> = [];
  try {
    const dbDeals = await db
      .select()
      .from(flightDeals)
      .where(eq(flightDeals.active, true))
      .orderBy(asc(flightDeals.sortOrder));

    if (dbDeals.length > 0) {
      // Filter to deals matching the detected origin, fall back to any origin
      const forOrigin = dbDeals.filter(d => d.origin === iata);
      const pool = forOrigin.length > 0 ? forOrigin : dbDeals;
      routes = pool.map(d => ({
        to: d.destination,
        city: d.city,
        country: d.country,
        image: d.imageUrl ?? d.city.toLowerCase().replace(/\s+/g, '-'),
      }));
    }
  } catch {
    // DB unavailable — proceed with hardcoded fallback
  }

  if (routes.length === 0) {
    routes = ROUTES[iata] ?? ROUTES.DEFAULT;
  }

  const departureDate = getNextDate(30);

  const dealResults = await Promise.all(
    routes.slice(0, 6).map((r, i) =>
      Promise.race([
        fetchDeal(iata, r.to, departureDate).then((d) => (d ? { ...d, ...r, from: iata } : null)),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
      ]).then((d) => d ?? { ...mockDeal(i, departureDate), ...r, from: iata }),
    ),
  );

  const enriched = dealResults.filter(Boolean).map((d) => ({
    ...d,
    imageUrl:
      DEST_IMAGES[(d as any).image?.toLowerCase() ?? ''] ??
      DEST_IMAGES[(d as any).city?.toLowerCase() ?? ''] ??
      (d as any).image?.startsWith('http') ? (d as any).image : FALLBACK_IMG,
    hot: (d as any).price < 300,
    tripType: 'one-way',
  }));

  const result = { origin: iata, deals: enriched };
  dealsCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
