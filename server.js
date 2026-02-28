// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables for Duffel API only
const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';

const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN || '';
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || process.env.TICKETMASTER_CONSUMER_KEY || '';
const EVENTBRITE_BASE_URL = 'https://www.eventbriteapi.com/v3';
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

// Middleware
app.use(express.static('.'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:8080'],
  credentials: true
}));
app.use(express.json());

// Cache for access token (not needed for Duffel, but keeping for future use)
let accessToken = null;
let tokenExpiry = null;

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function eventbriteGet(urlPath) {
  const url = `${EVENTBRITE_BASE_URL}${urlPath}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${EVENTBRITE_TOKEN}`,
      Accept: 'application/json'
    }
  });
  const text = await resp.text();
  const json = safeJson(text);
  return { ok: resp.ok, status: resp.status, json, text };
}

function normalizeTicketmasterEvent(e) {
  const name = String(e?.name || '').trim();
  const url = String(e?.url || '').trim();
  const startLocal = e?.dates?.start?.dateTime || e?.dates?.start?.localDate || '';
  const venue = e?._embedded?.venues?.[0];

  const images = Array.isArray(e?.images) ? e.images : [];
  const bestImg = images
    .slice()
    .sort((a, b) => (b?.width || 0) - (a?.width || 0))[0];
  const logoUrl = bestImg?.url || '';

  const priceRange = Array.isArray(e?.priceRanges) ? e.priceRanges[0] : null;
  const currency = priceRange?.currency || 'USD';
  const minPrice = typeof priceRange?.min === 'number' ? priceRange.min : null;

  return {
    id: e?.id || url || name,
    url,
    name: { text: name },
    description: { text: '' },
    start: { local: startLocal },
    logo: logoUrl ? { url: logoUrl } : null,
    venue: venue
      ? {
        name: String(venue?.name || ''),
        address: {
          city: String(venue?.city?.name || ''),
          region: String(venue?.state?.name || ''),
          country: String(venue?.country?.name || '')
        }
      }
      : null,
    currency,
    price: minPrice === null ? 0 : minPrice,
    is_free: minPrice === 0,
    source: 'ticketmaster'
  };
}

async function fetchTicketmasterEventsByLocation(location) {
  if (!TICKETMASTER_API_KEY) {
    return { ok: false, status: 500, error: 'Ticketmaster API key not configured. Add TICKETMASTER_API_KEY to your .env file.', events: [] };
  }

  const params = new URLSearchParams({
    apikey: TICKETMASTER_API_KEY,
    keyword: location,
    size: '30',
    sort: 'date,asc'
  });
  const url = `${TICKETMASTER_BASE_URL}/events.json?${params.toString()}`;

  const resp = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  const text = await resp.text();
  const json = safeJson(text);

  if (!resp.ok) {
    return { ok: false, status: resp.status, error: 'Ticketmaster upstream error', details: text, events: [] };
  }

  const embedded = json && json._embedded && json._embedded.events ? json._embedded.events : [];
  const events = Array.isArray(embedded) ? embedded.map(normalizeTicketmasterEvent) : [];
  return { ok: true, status: 200, events };
}

async function fetchEventbriteEventsByLocation(location) {
  if (!EVENTBRITE_TOKEN) {
    return { ok: false, status: 500, error: 'Eventbrite token not configured. Add EVENTBRITE_TOKEN to your .env file.', events: [] };
  }

  const orgsResp = await eventbriteGet('/users/me/organizations/?page_size=50');
  if (!orgsResp.ok) {
    return { ok: false, status: orgsResp.status || 502, error: 'Eventbrite upstream error', details: orgsResp.text || '', events: [] };
  }

  const orgs = Array.isArray(orgsResp.json?.organizations) ? orgsResp.json.organizations : [];
  const locationLc = String(location || '').trim().toLowerCase();

  const perOrg = await Promise.all(
    orgs.map(async (org) => {
      const orgId = org && org.id ? String(org.id) : '';
      if (!orgId) return [];
      const evResp = await eventbriteGet(`/organizations/${encodeURIComponent(orgId)}/events/?status=live&order_by=start_asc&expand=venue,logo&page_size=50`);
      if (!evResp.ok) return [];
      const events = Array.isArray(evResp.json?.events) ? evResp.json.events : [];

      return events.filter((e) => {
        const venue = e?.venue;
        const city = String(venue?.address?.city || '');
        const addr = String(venue?.address?.localized_address_display || '');
        const name = String(venue?.name || '');
        const hay = `${city} ${addr} ${name}`.toLowerCase();
        return locationLc ? hay.includes(locationLc) : true;
      });
    })
  );

  const flat = perOrg.flat().slice(0, 60);
  return { ok: true, status: 200, events: flat };
}


app.get('/api/events/status', async (req, res) => {
  const eventbriteConfigured = !!EVENTBRITE_TOKEN;
  const ticketmasterConfigured = !!TICKETMASTER_API_KEY;
  if (!eventbriteConfigured && !ticketmasterConfigured) {
    return res.json({ ok: false, error: 'No events providers configured. Set EVENTBRITE_TOKEN and/or TICKETMASTER_API_KEY.' });
  }
  return res.json({ ok: true, eventbriteConfigured, ticketmasterConfigured });
});

app.get('/api/events/search', async (req, res) => {
  try {
    const location = String(req.query.location || '').trim();
    if (!location) {
      return res.status(400).json({ ok: false, error: 'Missing required parameter: location' });
    }

    const result = await fetchEventbriteEventsByLocation(location);
    if (!result.ok) {
      return res.status(result.status || 500).json({ ok: false, error: result.error || 'Event search failed', details: result.details || '' });
    }
    return res.json({ ok: true, events: result.events || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
  }
});

app.get('/api/events/ticketmaster', async (req, res) => {
  try {
    const location = String(req.query.location || '').trim();
    if (!location) {
      return res.status(400).json({ ok: false, error: 'Missing required parameter: location' });
    }

    const result = await fetchTicketmasterEventsByLocation(location);
    if (!result.ok) {
      return res.status(result.status || 500).json({ ok: false, error: result.error || 'Ticketmaster search failed', details: result.details || '' });
    }
    return res.json({ ok: true, events: result.events || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
  }
});

app.get('/api/events/search-combined', async (req, res) => {
  try {
    const location = String(req.query.location || '').trim();
    if (!location) {
      return res.status(400).json({ ok: false, error: 'Missing required parameter: location' });
    }

    const [eb, tm] = await Promise.all([
      EVENTBRITE_TOKEN ? fetchEventbriteEventsByLocation(location) : Promise.resolve({ ok: false, events: [] }),
      TICKETMASTER_API_KEY ? fetchTicketmasterEventsByLocation(location) : Promise.resolve({ ok: false, events: [] })
    ]);

    const combined = [];
    const seen = new Set();

    for (const e of (eb.events || [])) {
      const key = String(e?.url || e?.id || '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        combined.push(e);
      }
    }
    for (const e of (tm.events || [])) {
      const key = String(e?.url || e?.id || '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        combined.push(e);
      }
    }

    if (combined.length === 0 && !EVENTBRITE_TOKEN && !TICKETMASTER_API_KEY) {
      return res.status(500).json({ ok: false, error: 'No events providers configured. Set EVENTBRITE_TOKEN and/or TICKETMASTER_API_KEY in your .env file.' });
    }

    combined.sort((a, b) => {
      const da = Date.parse(a?.start?.local || '') || 0;
      const db = Date.parse(b?.start?.local || '') || 0;
      return da - db;
    });

    return res.json({ ok: true, events: combined.slice(0, 80) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
  }
});



// ============================================================================
// DUFFEL API ENDPOINTS  
// ============================================================================

/**
 * Create offer request and get flight offers using Duffel API
 */
app.post('/api/duffel-search', async (req, res) => {
  try {
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      travelClass = 'ECONOMY',
      currencyCode = 'USD',
      max = 30
    } = req.body;

    // Validation
    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required parameters: originLocationCode, destinationLocationCode, departureDate'
      });
    }

    if (!DUFFEL_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'Duffel API key not configured. Add DUFFEL_API_KEY to your .env file.'
      });
    }

    console.log(`Duffel search: ${originLocationCode} → ${destinationLocationCode} on ${departureDate}`);

    // Build slices - Duffel v2 accepts IATA codes directly as strings
    const slices = [
      {
        origin: originLocationCode,
        destination: destinationLocationCode,
        departure_date: departureDate
      }
    ];

    // Add return slice if round trip
    if (returnDate) {
      slices.push({
        origin: destinationLocationCode,
        destination: originLocationCode,
        departure_date: returnDate
      });
    }

    // Build passengers array - each passenger is a separate object
    const passengers = [];
    for (let i = 0; i < adults; i++) {
      passengers.push({ type: 'adult' });
    }
    for (let i = 0; i < children; i++) {
      passengers.push({ type: 'child' });
    }
    for (let i = 0; i < infants; i++) {
      passengers.push({ type: 'infant_without_seat' });
    }

    // Map cabin class
    const cabinMap = {
      'ECONOMY': 'economy',
      'Economy': 'economy',
      'economy': 'economy',
      'PREMIUM_ECONOMY': 'premium_economy',
      'Premium Economy': 'premium_economy',
      'BUSINESS': 'business',
      'Business': 'business',
      'FIRST': 'first',
      'First': 'first'
    };
    const cabin = cabinMap[travelClass] || 'economy';

    // Create offer request
    const offerRequestData = {
      data: {
        slices,
        passengers,
        cabin_class: cabin
      }
    };

    console.log(`Duffel offer request: ${originLocationCode} → ${destinationLocationCode}, ${passengers.length} pax, ${cabin}`);

    // Create offer request
    const createResponse = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      },
      body: JSON.stringify(offerRequestData)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('Duffel offer request failed:', error);
      return res.status(createResponse.status).json({
        ok: false,
        error: `Duffel offer request failed: ${error}`
      });
    }

    const createData = await createResponse.json();
    const offerRequestId = createData.data?.id;

    if (!offerRequestId) {
      return res.status(500).json({
        ok: false,
        error: 'Failed to create offer request'
      });
    }

    console.log(`Created offer request: ${offerRequestId}`);

    // Step 2: Get offers for this request
    const offersResponse = await fetch(
      `${DUFFEL_BASE_URL}/air/offers?offer_request_id=${offerRequestId}&limit=${max}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Duffel-Version': 'v2',
          'Authorization': `Bearer ${DUFFEL_API_KEY}`
        }
      }
    );

    console.log(`Duffel offers response status: ${offersResponse.status}`);

    if (!offersResponse.ok) {
      const errorData = await offersResponse.json().catch(() => ({ errors: [] }));
      const errorMsg = errorData.errors?.[0]?.detail || `Duffel offers failed: ${offersResponse.status}`;
      console.error(`Duffel offers error: ${JSON.stringify(errorData)}`);
      return res.status(offersResponse.status).json({
        ok: false,
        error: errorMsg
      });
    }

    const offersData = await offersResponse.json();
    const offers = offersData.data || [];
    console.log(`Found ${offers.length} Duffel flight offers`);

    // Transform offers to our format
    const flights = offers.slice(0, max).map((offer, index) => {
      const slice = offer.slices?.[0] || {};
      const segment = slice.segments?.[0] || {};

      // Calculate duration
      let durationMin = 120; // default
      if (slice.duration) {
        // Parse PT02H26M format to minutes
        const match = slice.duration.match(/PT(\d+)H?(\d+)M?/);
        if (match) {
          const hours = parseInt(match[1]) || 0;
          const minutes = parseInt(match[2]) || 0;
          durationMin = hours * 60 + minutes;
        }
      }

      // Get airline info
      const airline = segment.marketing_carrier || segment.operating_carrier || {};
      const airlineCode = airline.iata_code || 'DF';

      // Get times
      let departTime = '00:00';
      let arriveTime = '23:59';
      if (segment.departing_at) {
        departTime = new Date(segment.departing_at).toTimeString().substring(0, 5);
      }
      if (segment.arriving_at) {
        arriveTime = new Date(segment.arriving_at).toTimeString().substring(0, 5);
      }

      // Count stops (segments - 1)
      const stops = Math.max(0, (slice.segments?.length || 1) - 1);

      // Get price (total price for all passengers)
      const price = parseFloat(offer.total_amount) || 0;

      return {
        id: `DF-${index}-${Date.now()}`,
        airline: {
          code: airlineCode,
          name: airline.name || 'Duffel Airline',
          logo: airlineCode.substring(0, 2).toUpperCase(),
          logoUrl: airline.logo_symbol_url || airline.logo_lockup_url || `https://airline-logos.com/${airlineCode.toLowerCase()}.png`
        },
        departTime,
        arriveTime,
        durationMin,
        stops,
        price,
        // Store full offer for later use
        _duffelOffer: offer
      };
    });

    res.json({
      ok: true,
      flights,
      meta: {
        count: flights.length,
        total: offers.length,
        source: 'duffel'
      }
    });

  } catch (error) {
    console.error('Error searching flights:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      ok: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Airport search for Amadeus
 */
app.get('/api/amadeus-airports', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.length < 2) {
      return res.json({ ok: true, airports: [] });
    }

    // Use expanded airport data for better search experience
    const commonAirports = [
      { city: "New York", name: "John F. Kennedy International", code: "JFK", country: "United States" },
      { city: "New York", name: "Newark Liberty International", code: "EWR", country: "United States" },
      { city: "Los Angeles", name: "Los Angeles International", code: "LAX", country: "United States" },
      { city: "Chicago", name: "O'Hare International", code: "ORD", country: "United States" },
      { city: "San Francisco", name: "San Francisco International", code: "SFO", country: "United States" },
      { city: "Miami", name: "Miami International", code: "MIA", country: "United States" },
      { city: "Boston", name: "Logan International", code: "BOS", country: "United States" },
      { city: "Washington", name: "Dulles International", code: "IAD", country: "United States" },
      { city: "Las Vegas", name: "McCarran International", code: "LAS", country: "United States" },
      { city: "Seattle", name: "Seattle-Tacoma International", code: "SEA", country: "United States" },
      { city: "London", name: "Heathrow", code: "LHR", country: "United Kingdom" },
      { city: "London", name: "Gatwick", code: "LGW", country: "United Kingdom" },
      { city: "Paris", name: "Charles de Gaulle", code: "CDG", country: "France" },
      { city: "Amsterdam", name: "Schiphol", code: "AMS", country: "Netherlands" },
      { city: "Frankfurt", name: "Frankfurt Airport", code: "FRA", country: "Germany" },
      { city: "Munich", name: "Munich Airport", code: "MUC", country: "Germany" },
      { city: "Rome", name: "Fiumicino", code: "FCO", country: "Italy" },
      { city: "Madrid", name: "Barajas", code: "MAD", country: "Spain" },
      { city: "Barcelona", name: "El Prat", code: "BCN", country: "Spain" },
      { city: "Istanbul", name: "Istanbul Airport", code: "IST", country: "Turkey" },
      { city: "Dubai", name: "Dubai International", code: "DXB", country: "UAE" },
      { city: "Doha", name: "Hamad International", code: "DOH", country: "Qatar" },
      { city: "Cairo", name: "Cairo International", code: "CAI", country: "Egypt" },
      { city: "Riyadh", name: "King Khalid International", code: "RUH", country: "Saudi Arabia" },
      { city: "Jeddah", name: "King Abdulaziz International", code: "JED", country: "Saudi Arabia" },
      { city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International", code: "BOM", country: "India" },
      { city: "Delhi", name: "Indira Gandhi International", code: "DEL", country: "India" },
      { city: "Tokyo", name: "Haneda", code: "HND", country: "Japan" },
      { city: "Tokyo", name: "Narita", code: "NRT", country: "Japan" },
      { city: "Seoul", name: "Incheon International", code: "ICN", country: "South Korea" },
      { city: "Singapore", name: "Changi", code: "SIN", country: "Singapore" },
      { city: "Hong Kong", name: "Hong Kong International", code: "HKG", country: "Hong Kong" },
      { city: "Bangkok", name: "Suvarnabhumi", code: "BKK", country: "Thailand" },
      { city: "Sydney", name: "Kingsford Smith", code: "SYD", country: "Australia" },
      { city: "Melbourne", name: "Tullamarine", code: "MEL", country: "Australia" },
      { city: "Toronto", name: "Pearson International", code: "YYZ", country: "Canada" },
      { city: "Vancouver", name: "Vancouver International", code: "YVR", country: "Canada" },
      { city: "Mexico City", name: "Benito Juárez International", code: "MEX", country: "Mexico" },
      { city: "São Paulo", name: "Guarulhos International", code: "GRU", country: "Brazil" },
      { city: "Nairobi", name: "Jomo Kenyatta International", code: "NBO", country: "Kenya" },
      { city: "Lagos", name: "Murtala Muhammed International", code: "LOS", country: "Nigeria" },
      { city: "Johannesburg", name: "O.R. Tambo International", code: "JNB", country: "South Africa" }
    ];

    const filtered = commonAirports.filter(airport =>
      airport.city.toLowerCase().includes(keyword.toLowerCase()) ||
      airport.code.toLowerCase().includes(keyword.toLowerCase()) ||
      airport.name.toLowerCase().includes(keyword.toLowerCase())
    );

    res.json({
      ok: true,
      airports: filtered.slice(0, 5)
    });

  } catch (error) {
    console.error('Error searching Amadeus airports:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/**
 * Airport search for Duffel (limited implementation)
 */
app.get('/api/duffel-airports', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.length < 2) {
      return res.json({ ok: true, airports: [] });
    }

    // Fetch from Duffel Places API
    const response = await fetch(`${DUFFEL_BASE_URL}/places/suggestions?query=${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error("Duffel places API error:", await response.text());
      return res.json({ ok: true, airports: [] });
    }

    const { data } = await response.json();

    // Process results to match our frontend format
    const airports = [];

    for (const place of data) {
      if (place.type === 'airport') {
        airports.push({
          city: place.city_name || place.name,
          name: place.name,
          code: place.iata_code,
          country: place.iata_country_code
        });
      } else if (place.type === 'city' && Array.isArray(place.airports)) {
        // If it's a city, add its airports
        for (const airport of place.airports) {
          airports.push({
            city: place.name || airport.city_name,
            name: airport.name,
            code: airport.iata_code,
            country: airport.iata_country_code || place.iata_country_code
          });
        }
      }
    }

    // Remove duplicates by code
    const uniqueAirports = Array.from(new Map(airports.map(a => [a.code, a])).values());

    res.json({ ok: true, airports: uniqueAirports.slice(0, 8) });

  } catch (error) {
    console.error('Error searching Duffel airports:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper functions for Duffel API
function mapCabinClass(travelClass) {
  const c = String(travelClass || "").toLowerCase();
  if (c === "first") return "first";
  if (c === "business") return "business";
  if (c === "premium") return "premium_economy";
  return "economy";
}

function transformDuffelData(data) {
  // Handle both offer_requests response (data.data.offers) and direct offers response (data.data as array)
  let offers = [];
  if (data.data && Array.isArray(data.data.offers)) {
    offers = data.data.offers;
  } else if (data.data && Array.isArray(data.data)) {
    offers = data.data;
  } else {
    return [];
  }

  return offers.map((offer) => {
    try {
      const slice = offer.slices?.[0];
      if (!slice || !slice.segments || slice.segments.length === 0) {
        console.warn('Missing slice/segments data, skipping offer');
        return null;
      }

      const firstSegment = slice.segments[0];
      const lastSegment = slice.segments[slice.segments.length - 1];
      const owner = firstSegment?.operating_carrier || firstSegment?.marketing_carrier;

      if (!owner) {
        console.warn('Missing carrier data, skipping offer');
        return null;
      }

      // Calculate times from segment departing_at / arriving_at
      const departTime = new Date(firstSegment.departing_at);
      const arriveTime = new Date(lastSegment.arriving_at);
      const durationMs = arriveTime - departTime;
      const durationMin = Math.round(durationMs / (1000 * 60));

      // Extract HH:MM strings
      const departTimeStr = firstSegment.departing_at.split('T')[1]?.substring(0, 5) || '00:00';
      const arriveTimeStr = lastSegment.arriving_at.split('T')[1]?.substring(0, 5) || '00:00';

      // Origin and destination airport info
      const origin = firstSegment.origin || {};
      const destination = lastSegment.destination || {};

      // Price - Duffel uses total_amount (string) and total_currency
      const price = parseFloat(offer.total_amount) || 0;

      return {
        id: offer.id,
        airline: {
          code: owner.iata_code || 'DF',
          name: owner.name || 'Duffel Airline',
          logo: (owner.iata_code || 'DF').substring(0, 2).toUpperCase(),
          logoUrl: owner.logo_symbol_url || owner.logo_lockup_url || ''
        },
        from: {
          city: origin.city_name || origin.iata_code || '',
          airport: origin.name || origin.iata_code || '',
          code: origin.iata_code || ''
        },
        to: {
          city: destination.city_name || destination.iata_code || '',
          airport: destination.name || destination.iata_code || '',
          code: destination.iata_code || ''
        },
        departTime: departTimeStr,
        arriveTime: arriveTimeStr,
        durationMin,
        stops: Math.max(0, (slice.segments?.length || 1) - 1),
        price: Math.round(price),
        cabin: offer.cabin_class || 'economy',
        segments: slice.segments.map(s => {
          const sDep = new Date(s.departing_at);
          const sArr = new Date(s.arriving_at);
          const sDurMs = sArr - sDep;
          return {
            airlineName: s.operating_carrier?.name || s.marketing_carrier?.name || 'Unknown Carrier',
            airlineCode: s.operating_carrier?.iata_code || s.marketing_carrier?.iata_code || '',
            flightNumber: s.operating_carrier_flight_number || s.marketing_carrier_flight_number || '',
            departTime: s.departing_at.split('T')[1]?.substring(0, 5) || '00:00',
            arriveTime: s.arriving_at.split('T')[1]?.substring(0, 5) || '00:00',
            departAirport: s.origin?.name || s.origin?.iata_code || '',
            departCity: s.origin?.city_name || '',
            departCode: s.origin?.iata_code || '',
            departTerminal: s.origin_terminal || '',
            arriveAirport: s.destination?.name || s.destination?.iata_code || '',
            arriveCity: s.destination?.city_name || '',
            arriveCode: s.destination?.iata_code || '',
            arriveTerminal: s.destination_terminal || '',
            aircraft: s.aircraft?.name || 'Standard Aircraft',
            durationMin: Math.round(sDurMs / (1000 * 60)),
            baggage: s.passengers?.[0]?.baggages || []
          };
        }),
        _duffelOffer: offer
      };
    } catch (e) {
      console.error('Error transforming Duffel offer:', e);
      return null;
    }
  }).filter(Boolean);
}

app.listen(PORT, () => {
  console.log(`BookingCart server running on http://localhost:${PORT}`);
  console.log(`Duffel API Key configured: ${!!DUFFEL_API_KEY}`);

  if (!DUFFEL_API_KEY) {
    console.warn('⚠️  WARNING: Duffel API key not configured!');
    console.warn('   Set DUFFEL_API_KEY environment variable to use live flight data.');
  } else {
    console.log('🎉 Duffel API is configured!');
    console.log('   Your website can now show real flight data from Duffel.');
  }
});
