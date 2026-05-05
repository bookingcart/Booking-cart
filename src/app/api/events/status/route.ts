import { NextResponse } from 'next/server';
import { eventsConfigured } from '@/lib/events';

export async function GET() {
  if (!eventsConfigured.eventbrite && !eventsConfigured.ticketmaster) {
    return NextResponse.json({
      ok: false,
      error: 'No events providers configured. Set EVENTBRITE_TOKEN and/or TICKETMASTER_API_KEY.',
    });
  }
  return NextResponse.json({ ok: true, ...eventsConfigured });
}
