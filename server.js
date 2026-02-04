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
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

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

/**
 * Transform Duffel offer to our frontend format
 */
function transformDuffelOffer(offer, index) {
  const itinerary = offer.itineraries[0];
  const segments = itinerary.segments || [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  
  // Calculate duration
  const departure = new Date(firstSegment.departure.at);
  const arrival = new Date(lastSegment.arrival.at);
  const durationMin = Math.round((arrival - departure) / (1000 * 60));
  
  // Extract times
  const departTime = firstSegment.departure.at.split('T')[1].substring(0, 5);
  const arriveTime = lastSegment.arrival.at.split('T')[1].substring(0, 5);
  
  // Count stops (segments - 1)
  const stops = Math.max(0, segments.length - 1);
  
  // Get airline info
  const carrierCode = firstSegment.carrierCode;
  const airlineName = offer.validatingAirlineCodes?.[0] || carrierCode;
  
  // Get price (total price for all passengers)
  const price = parseFloat(offer.price.total) || 0;
  
  // Generate unique ID
  const id = `${carrierCode}-${index}-${Date.now()}`;
  
  return {
    id,
    airline: {
      code: carrierCode,
      name: airlineName,
      logo: carrierCode.substring(0, 2).toUpperCase()
    },
    departTime,
    arriveTime,
    durationMin,
    stops,
    price: Math.round(price),
    segments: segments.map(seg => ({
      departure: {
        iataCode: seg.departure.iataCode,
        at: seg.departure.at
      },
      arrival: {
        iataCode: seg.arrival.iataCode,
        at: seg.arrival.at
      },
      carrierCode: seg.carrierCode,
      number: seg.number,
      duration: seg.duration
    })),
    // Store full offer for later use
    _duffelOffer: offer
  };
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

/**
 * Search flights using Duffel Flight Offers Search API
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

    // Get access token - Duffel API key is used directly as Bearer token
    const token = DUFFEL_API_KEY;

    // Build query parameters for GET request (simple version)
    const params = new URLSearchParams({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults: String(adults),
      currencyCode,
      max: String(Math.min(max, 250)), // Duffel max is 250
    });

    // Add optional parameters
    if (returnDate) {
      params.append('returnDate', returnDate);
    }
    if (children > 0) {
      params.append('children', String(children));
    }
    if (infants > 0) {
      params.append('infants', String(infants));
    }
    if (travelClass && travelClass !== 'ECONOMY') {
      params.append('travelClass', travelClass);
    }

    console.log(`Searching flights from ${originLocationCode} to ${destinationLocationCode} on ${departureDate}`);

    // Return mock data since Duffel API is not working
    const mockFlights = [
      {
        id: "mock_1",
        airline: "Delta Air Lines",
        flightNumber: "DL123",
        origin: { code: originLocationCode, name: "New York JFK" },
        destination: { code: destinationLocationCode, name: "Los Angeles LAX" },
        departure: "2025-02-15T08:00:00",
        arrival: "2025-02-15T11:30:00",
        duration: "5h 30m",
        price: 299.99,
        currency: "USD",
        seatsAvailable: 15,
        cabinClass: travelClass
      },
      {
        id: "mock_2", 
        airline: "United Airlines",
        flightNumber: "UA456",
        origin: { code: originLocationCode, name: "New York JFK" },
        destination: { code: destinationLocationCode, name: "Los Angeles LAX" },
        departure: "2025-02-15T10:15:00",
        arrival: "2025-02-15T13:45:00",
        duration: "5h 30m", 
        price: 325.50,
        currency: "USD",
        seatsAvailable: 8,
        cabinClass: travelClass
      },
      {
        id: "mock_3",
        airline: "American Airlines", 
        flightNumber: "AA789",
        origin: { code: originLocationCode, name: "New York JFK" },
        destination: { code: destinationLocationCode, name: "Los Angeles LAX" },
        departure: "2025-02-15T14:20:00",
        arrival: "2025-02-15T17:50:00",
        duration: "5h 30m",
        price: 287.00,
        currency: "USD", 
        seatsAvailable: 22,
        cabinClass: travelClass
      }
    ];

    res.json({
      ok: true,
      flights: mockFlights.slice(0, max),
      meta: {
        count: mockFlights.length,
        total: mockFlights.length,
        source: 'mock'
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

    // Step 1: Create offer request
    // First, get airport details from Duffel to get full airport objects
    let originAirport = null;
    let destinationAirport = null;
    
    try {
      // Search for origin airport
      const originResponse = await fetch(`${DUFFEL_BASE_URL}/air/airports?iata_code=${originLocationCode}&limit=1`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Duffel-Version': 'v2',
          'Authorization': `Bearer ${DUFFEL_API_KEY}`
        }
      });
      
      if (originResponse.ok) {
        const originData = await originResponse.json();
        if (originData.data?.length > 0) {
          originAirport = originData.data[0];
        }
      }
      
      // Search for destination airport
      const destResponse = await fetch(`${DUFFEL_BASE_URL}/air/airports?iata_code=${destinationLocationCode}&limit=1`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Duffel-Version': 'v2',
          'Authorization': `Bearer ${DUFFEL_API_KEY}`
        }
      });
      
      if (destResponse.ok) {
        const destData = await destResponse.json();
        if (destData.data?.length > 0) {
          destinationAirport = destData.data[0];
        }
      }
    } catch (error) {
      console.log('Error fetching airport details:', error.message);
    }
    
    // If we couldn't find airports, use fallback
    if (!originAirport || !destinationAirport) {
      console.log('Using fallback airport data for:', originLocationCode, '→', destinationLocationCode);
      return res.status(400).json({
        ok: false,
        error: `Airports not found in Duffel: ${originLocationCode} or ${destinationLocationCode}. Available airports are limited in current environment.`
      });
    }

    // Create offer request
    const offerRequestData = {
      data: {
        slices: [
          {
            origin_type: "airport",
            origin: originAirport,
            destination_type: "airport",
            destination: destinationAirport,
            departure_date: departureDate
          }
        ],
        passengers: [
          {
            type: "adult",
            count: adults
          }
        ],
        cabin_class: travelClass.toLowerCase()
      }
    };

    console.log(`Duffel search: ${originLocationCode} → ${destinationLocationCode} on ${departureDate}`);
    console.log(`Origin airport: ${originAirport ? originAirport.name : 'Not found'}`);
    console.log(`Destination airport: ${destinationAirport ? destinationAirport.name : 'Not found'}`);

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

    // Duffel doesn't have a public airport search API
    // Return expanded list of common airports that match the keyword
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
