import { NextRequest, NextResponse } from 'next/server';
import { fetchEventbriteEvents, fetchTicketmasterEvents, eventsConfigured } from '@/lib/events';

export async function GET(request: NextRequest) {
  try {
    const location = new URL(request.url).searchParams.get('location')?.trim() ?? '';
    if (!location) {
      return NextResponse.json({ ok: false, error: 'Missing required parameter: location' }, { status: 400 });
    }

    const [eb, tm] = await Promise.all([
      eventsConfigured.eventbrite
        ? fetchEventbriteEvents(location)
        : Promise.resolve({ ok: false, events: [] as any[] }),
      eventsConfigured.ticketmaster
        ? fetchTicketmasterEvents(location)
        : Promise.resolve({ ok: false, events: [] as any[] }),
    ]);

    const combined: any[] = [];
    const seen = new Set<string>();
    for (const e of [...(eb.events ?? []), ...(tm.events ?? [])]) {
      const key = String(e?.url ?? e?.id ?? '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        combined.push(e);
      }
    }

    return NextResponse.json({ ok: true, events: combined });
  } catch (err) {
    console.error('/api/events/search-combined error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
