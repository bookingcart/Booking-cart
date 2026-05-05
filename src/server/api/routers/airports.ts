import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const AIRPORTS = [
  { city: 'London', name: 'Heathrow', code: 'LHR', country: 'United Kingdom' },
  { city: 'London', name: 'Gatwick', code: 'LGW', country: 'United Kingdom' },
  { city: 'Paris', name: 'Charles de Gaulle', code: 'CDG', country: 'France' },
  { city: 'Amsterdam', name: 'Schiphol', code: 'AMS', country: 'Netherlands' },
  { city: 'Frankfurt', name: 'Frankfurt', code: 'FRA', country: 'Germany' },
  { city: 'Munich', name: 'Munich', code: 'MUC', country: 'Germany' },
  { city: 'Rome', name: 'Fiumicino', code: 'FCO', country: 'Italy' },
  { city: 'Madrid', name: 'Barajas', code: 'MAD', country: 'Spain' },
  { city: 'Barcelona', name: 'El Prat', code: 'BCN', country: 'Spain' },
  { city: 'Istanbul', name: 'Istanbul', code: 'IST', country: 'Turkey' },
  { city: 'Dubai', name: 'Dubai', code: 'DXB', country: 'United Arab Emirates' },
  { city: 'Doha', name: 'Hamad', code: 'DOH', country: 'Qatar' },
  { city: 'Cairo', name: 'Cairo', code: 'CAI', country: 'Egypt' },
  { city: 'Nairobi', name: 'Jomo Kenyatta International', code: 'NBO', country: 'Kenya' },
  { city: 'Kampala', name: 'Entebbe International', code: 'EBB', country: 'Uganda' },
  { city: 'Lagos', name: 'Murtala Muhammed', code: 'LOS', country: 'Nigeria' },
  { city: 'Johannesburg', name: 'O.R. Tambo', code: 'JNB', country: 'South Africa' },
  { city: 'New York', name: 'JFK', code: 'JFK', country: 'United States' },
  { city: 'New York', name: 'Newark', code: 'EWR', country: 'United States' },
  { city: 'Boston', name: 'Logan', code: 'BOS', country: 'United States' },
  { city: 'Chicago', name: "O'Hare", code: 'ORD', country: 'United States' },
  { city: 'Los Angeles', name: 'LAX', code: 'LAX', country: 'United States' },
  { city: 'San Francisco', name: 'SFO', code: 'SFO', country: 'United States' },
  { city: 'Toronto', name: 'Pearson', code: 'YYZ', country: 'Canada' },
  { city: 'São Paulo', name: 'Guarulhos', code: 'GRU', country: 'Brazil' },
  { city: 'Tokyo', name: 'Haneda', code: 'HND', country: 'Japan' },
  { city: 'Tokyo', name: 'Narita', code: 'NRT', country: 'Japan' },
  { city: 'Seoul', name: 'Incheon', code: 'ICN', country: 'South Korea' },
  { city: 'Singapore', name: 'Changi', code: 'SIN', country: 'Singapore' },
  { city: 'Bangkok', name: 'Suvarnabhumi', code: 'BKK', country: 'Thailand' },
  { city: 'Delhi', name: 'Indira Gandhi', code: 'DEL', country: 'India' },
  { city: 'Mumbai', name: 'Chhatrapati Shivaji', code: 'BOM', country: 'India' },
  { city: 'Sydney', name: 'Kingsford Smith', code: 'SYD', country: 'Australia' },
  { city: 'Atlanta', name: 'Hartsfield-Jackson', code: 'ATL', country: 'United States' },
  { city: 'Miami', name: 'International', code: 'MIA', country: 'United States' },
  { city: 'Dallas', name: 'Fort Worth', code: 'DFW', country: 'United States' },
];

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY ?? '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';

export const airportsRouter = router({
  amadeus: publicProcedure
    .input(z.object({ keyword: z.string().min(1) }))
    .query(({ input }) => {
      const kw = input.keyword.toLowerCase();
      if (kw.length < 2) return { airports: [] };
      const results = AIRPORTS.filter((a) =>
        `${a.city} ${a.name} ${a.code}`.toLowerCase().includes(kw),
      ).slice(0, 10);
      return { airports: results };
    }),

  duffel: publicProcedure
    .input(z.object({ keyword: z.string().min(1) }))
    .query(async ({ input }) => {
      if (input.keyword.length < 2 || !DUFFEL_API_KEY) return { airports: [] };

      const resp = await fetch(
        `${DUFFEL_BASE_URL}/places/suggestions?query=${encodeURIComponent(input.keyword)}`,
        {
          headers: {
            Accept: 'application/json',
            'Duffel-Version': 'v2',
            Authorization: `Bearer ${DUFFEL_API_KEY}`,
          },
        },
      );

      if (!resp.ok) return { airports: [] };

      const { data } = await resp.json();
      const airports: Array<{ city: string; name: string; code: string; country: string }> = [];

      for (const place of data ?? []) {
        if (place.type === 'airport') {
          airports.push({
            city: place.city_name ?? place.name,
            name: place.name,
            code: place.iata_code,
            country: place.iata_country_code,
          });
        } else if (place.type === 'city' && Array.isArray(place.airports)) {
          for (const ap of place.airports) {
            airports.push({
              city: place.name,
              name: ap.name,
              code: ap.iata_code,
              country: place.iata_country_code,
            });
          }
        }
      }

      return { airports };
    }),
});
