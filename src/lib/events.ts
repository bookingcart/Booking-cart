const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN ?? '';
const TICKETMASTER_API_KEY =
  process.env.TICKETMASTER_API_KEY ?? process.env.TICKETMASTER_CONSUMER_KEY ?? '';
const EVENTBRITE_BASE_URL = 'https://www.eventbriteapi.com/v3';
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

async function eventbriteGet(urlPath: string) {
  const resp = await fetch(`${EVENTBRITE_BASE_URL}${urlPath}`, {
    headers: {
      Authorization: `Bearer ${EVENTBRITE_TOKEN}`,
      Accept: 'application/json',
    },
  });
  let json: any = null;
  try {
    json = await resp.json();
  } catch {}
  return { ok: resp.ok, status: resp.status, json };
}

function normalizeTicketmasterEvent(e: any) {
  const name = String(e?.name ?? '').trim();
  const url = String(e?.url ?? '').trim();
  const startLocal = e?.dates?.start?.dateTime ?? e?.dates?.start?.localDate ?? '';
  const venue = e?._embedded?.venues?.[0];
  const images: any[] = Array.isArray(e?.images) ? e.images : [];
  const bestImg = images.slice().sort((a, b) => (b?.width ?? 0) - (a?.width ?? 0))[0];
  const priceRange = Array.isArray(e?.priceRanges) ? e.priceRanges[0] : null;
  const minPrice = typeof priceRange?.min === 'number' ? priceRange.min : null;
  return {
    id: e?.id ?? url ?? name,
    url,
    name: { text: name },
    description: { text: '' },
    start: { local: startLocal },
    logo: bestImg?.url ? { url: bestImg.url } : null,
    venue: venue
      ? {
          name: String(venue?.name ?? ''),
          address: {
            city: String(venue?.city?.name ?? ''),
            region: String(venue?.state?.name ?? ''),
            country: String(venue?.country?.name ?? ''),
          },
        }
      : null,
    currency: priceRange?.currency ?? 'USD',
    price: minPrice ?? 0,
    is_free: minPrice === 0,
    source: 'ticketmaster',
  };
}

export async function fetchTicketmasterEvents(location: string) {
  if (!TICKETMASTER_API_KEY) {
    return { ok: false, status: 500, error: 'Ticketmaster API key not configured.', events: [] };
  }
  const params = new URLSearchParams({
    apikey: TICKETMASTER_API_KEY,
    keyword: location,
    size: '30',
    sort: 'date,asc',
  });
  const resp = await fetch(`${TICKETMASTER_BASE_URL}/events.json?${params}`, {
    headers: { Accept: 'application/json' },
  });
  let json: any = null;
  try {
    json = await resp.json();
  } catch {}
  if (!resp.ok) {
    return { ok: false, status: resp.status, error: 'Ticketmaster upstream error', events: [] };
  }
  const embedded = json?._embedded?.events ?? [];
  return { ok: true, status: 200, events: (embedded as any[]).map(normalizeTicketmasterEvent) };
}

export async function fetchEventbriteEvents(location: string) {
  if (!EVENTBRITE_TOKEN) {
    return { ok: false, status: 500, error: 'Eventbrite token not configured.', events: [] };
  }
  const orgsResp = await eventbriteGet('/users/me/organizations/?page_size=50');
  if (!orgsResp.ok) {
    return { ok: false, status: orgsResp.status ?? 502, error: 'Eventbrite upstream error', events: [] };
  }
  const orgs: any[] = Array.isArray(orgsResp.json?.organizations) ? orgsResp.json.organizations : [];
  const locationLc = String(location ?? '').trim().toLowerCase();
  const perOrg = await Promise.all(
    orgs.map(async (org) => {
      const orgId = org?.id ? String(org.id) : '';
      if (!orgId) return [];
      const evResp = await eventbriteGet(
        `/organizations/${encodeURIComponent(orgId)}/events/?status=live&order_by=start_asc&expand=venue,logo&page_size=50`,
      );
      if (!evResp.ok) return [];
      const events: any[] = Array.isArray(evResp.json?.events) ? evResp.json.events : [];
      return events.filter((e) => {
        const venue = e?.venue;
        const hay =
          `${venue?.address?.city ?? ''} ${venue?.address?.localized_address_display ?? ''} ${venue?.name ?? ''}`.toLowerCase();
        return locationLc ? hay.includes(locationLc) : true;
      });
    }),
  );
  return { ok: true, status: 200, events: perOrg.flat().slice(0, 60) };
}

export const eventsConfigured = {
  eventbrite: !!EVENTBRITE_TOKEN,
  ticketmaster: !!TICKETMASTER_API_KEY,
};
