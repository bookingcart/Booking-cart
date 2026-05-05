import { NextRequest, NextResponse } from 'next/server';

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY ?? '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';

export async function GET(request: NextRequest) {
  try {
    const keyword = new URL(request.url).searchParams.get('keyword') ?? '';
    if (!keyword || keyword.length < 2) {
      return NextResponse.json({ ok: true, airports: [] });
    }
    if (!DUFFEL_API_KEY) {
      return NextResponse.json({ ok: true, airports: [] });
    }

    const resp = await fetch(
      `${DUFFEL_BASE_URL}/places/suggestions?query=${encodeURIComponent(keyword)}`,
      {
        headers: {
          Accept: 'application/json',
          'Duffel-Version': 'v2',
          Authorization: `Bearer ${DUFFEL_API_KEY}`,
        },
      },
    );

    if (!resp.ok) {
      return NextResponse.json({ ok: true, airports: [] });
    }

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

    return NextResponse.json({ ok: true, airports });
  } catch (err) {
    console.error('/api/duffel-airports error:', err);
    return NextResponse.json({ ok: true, airports: [] });
  }
}
