import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY ?? '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const DEALS_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

const searchCache = new Map<string, { data: Record<string, unknown>; expiresAt: number }>();
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
const FALLBACK_IMG =
  'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop';

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

export const flightsRouter = router({
  search: publicProcedure
    .input(
      z.object({
        originLocationCode: z.string().min(1),
        destinationLocationCode: z.string().min(1),
        departureDate: z.string().min(1),
        returnDate: z.string().optional(),
        adults: z.number().int().min(1).default(1),
        children: z.number().int().min(0).default(0),
        infants: z.number().int().min(0).default(0),
        travelClass: z.string().default('ECONOMY'),
        max: z.number().int().min(1).max(100).default(30),
      }),
    )
    .mutation(async ({ input }) => {
      const {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults,
        children,
        infants,
        travelClass,
        max,
      } = input;

      if (!DUFFEL_API_KEY) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Flight search is not configured' });
      }

      const cacheKey = JSON.stringify({
        originLocationCode, destinationLocationCode, departureDate,
        returnDate, adults, children, infants, travelClass,
      });
      const cached = searchCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return { ...cached.data, fromCache: true };
      }

      const slices: Array<{ origin: string; destination: string; departure_date: string }> = [
        { origin: originLocationCode, destination: destinationLocationCode, departure_date: departureDate },
      ];
      if (returnDate) {
        slices.push({ origin: destinationLocationCode, destination: originLocationCode, departure_date: returnDate });
      }

      const passengers: Array<{ type: string }> = [];
      for (let i = 0; i < adults; i++) passengers.push({ type: 'adult' });
      for (let i = 0; i < children; i++) passengers.push({ type: 'child' });
      for (let i = 0; i < infants; i++) passengers.push({ type: 'infant_without_seat' });

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
        body: JSON.stringify({ data: { slices, passengers, cabin_class: cabin, return_offers: false } }),
      });

      if (!offerRequestResp.ok) {
        throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Flight search failed' });
      }

      const { data: offerRequest } = await offerRequestResp.json();

      const offersResp = await fetch(
        `${DUFFEL_BASE_URL}/air/offers?offer_request_id=${offerRequest?.id}&limit=${max}&sort=total_amount`,
        {
          headers: {
            Accept: 'application/json',
            'Duffel-Version': 'v2',
            Authorization: `Bearer ${DUFFEL_API_KEY}`,
          },
        },
      );

      if (!offersResp.ok) {
        throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Failed to retrieve offers' });
      }

      const { data: offers, meta } = await offersResp.json();
      const result = { offers: offers ?? [], meta: meta ?? {} };
      searchCache.set(cacheKey, { data: result, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS });

      return result;
    }),

  deals: publicProcedure
    .input(
      z.object({
        origin: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        ip: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { origin: overrideIata = '', city: clientCity = '', country: clientCountry = '', ip = '' } = input;

      const cacheKey = `deals_${overrideIata || clientCity || 'default'}`;
      const cached = dealsCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return { ...(cached.data as any), cached: true };
      }

      let iata = overrideIata;
      if (!iata && clientCity) iata = CITY_TO_IATA[clientCity.toLowerCase()] ?? '';
      if (!iata && clientCountry) iata = COUNTRY_TO_IATA[clientCountry] ?? '';
      if (!iata && ip) {
        const isLocal = ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.');
        if (!isLocal) {
          try {
            const geoResp = await fetch(`http://ip-api.com/json/${ip}?fields=city,country`, {
              signal: AbortSignal.timeout(3000),
            });
            if (geoResp.ok) {
              const geo = await geoResp.json();
              iata = CITY_TO_IATA[(geo.city ?? '').toLowerCase()] ?? COUNTRY_TO_IATA[geo.country ?? ''] ?? '';
            }
          } catch {}
        }
      }
      if (!iata) iata = 'EBB';

      const routes = ROUTES[iata] ?? ROUTES.DEFAULT;
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
          FALLBACK_IMG,
        hot: (d as any).price < 300,
        tripType: 'one-way',
      }));

      const result = { origin: iata, deals: enriched };
      dealsCache.set(cacheKey, { data: result, expiresAt: Date.now() + DEALS_CACHE_TTL_MS });

      return result;
    }),
});
