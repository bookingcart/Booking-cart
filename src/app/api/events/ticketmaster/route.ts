import { NextRequest, NextResponse } from 'next/server';
import { fetchTicketmasterEvents } from '@/lib/events';

export async function GET(request: NextRequest) {
  try {
    const location = new URL(request.url).searchParams.get('location')?.trim() ?? '';
    if (!location) {
      return NextResponse.json({ ok: false, error: 'Missing required parameter: location' }, { status: 400 });
    }
    const result = await fetchTicketmasterEvents(location);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 500 });
    }
    return NextResponse.json({ ok: true, events: result.events });
  } catch (err) {
    console.error('/api/events/ticketmaster error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
