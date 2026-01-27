// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables for Amadeus API
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY || '';
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET || '';
const AMADEUS_ENV = process.env.AMADEUS_ENV || 'test'; // 'test' or 'production'

// Environment variables for Duffel API
const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';

// Environment variables for Eventbrite API
const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN || '';

const AMADEUS_BASE_URL = AMADEUS_ENV === 'production' 
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Cache for access token
let accessToken = null;
let tokenExpiry = null;

/**
 * Get Amadeus OAuth 2.0 access token
 */
async function getAmadeusToken() {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('Using cached Amadeus token');
    return accessToken;
  }

  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    throw new Error('Amadeus API credentials not configured');
  }

  console.log('Requesting new Amadeus token...');
  console.log(`API URL: ${AMADEUS_BASE_URL}/v1/security/oauth2/token`);
  console.log(`API Key: ${AMADEUS_API_KEY.substring(0, 8)}...`);

  try {
    const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET,
      }),
    });

    console.log(`Token response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`Token error response: ${error}`);
      throw new Error(`Amadeus token error: ${error}`);
    }

    const data = await response.json();
    console.log('Token received successfully');
    accessToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
    
    return accessToken;
  } catch (error) {
    console.error('Error getting Amadeus token:', error);
    throw error;
  }
}

/**
 * Transform Amadeus flight offer to our frontend format
 */
function transformFlightOffer(offer, index) {
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
    _amadeusOffer: offer
  };
}

/**
 * Search flights using Amadeus Flight Offers Search API
 */
app.post('/api/amadeus-search', async (req, res) => {
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

    // Get access token
    const token = await getAmadeusToken();

    // Build query parameters for GET request (simple version)
    const params = new URLSearchParams({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults: String(adults),
      currencyCode,
      max: String(Math.min(max, 250)), // Amadeus max is 250
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

    console.log(`Searching flights with params: ${params.toString()}`);

    // Call Amadeus Flight Offers Search API (GET version)
    const response = await fetch(
      `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.amadeus+json'
        }
      }
    );

    console.log(`Flight search response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ errors: [] }));
      const errorMsg = errorData.errors?.[0]?.detail || `Amadeus API error: ${response.status}`;
      console.error(`Flight search error: ${JSON.stringify(errorData)}`);
      return res.status(response.status).json({
        ok: false,
        error: errorMsg
      });
    }

    const data = await response.json();
    const offers = data.data || [];
    console.log(`Found ${offers.length} flight offers`);

    // Transform offers to our format
    const flights = offers.slice(0, max).map((offer, index) => 
      transformFlightOffer(offer, index)
    );

    res.json({
      ok: true,
      flights,
      meta: {
        count: flights.length,
        total: offers.length,
        source: 'amadeus'
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
 * Airport/City Search using Amadeus Airport & City Search API
 */
app.get('/api/amadeus-airports', async (req, res) => {
  try {
    const { keyword } = req.query;
    console.log(`Airport search request for keyword: "${keyword}"`);

    if (!keyword || keyword.length < 2) {
      console.log('Keyword too short, returning empty results');
      return res.json({ ok: true, airports: [] });
    }

    const token = await getAmadeusToken();
    console.log(`Got token, searching airports for: ${keyword}`);

    const params = new URLSearchParams({
      keyword,
      subType: 'AIRPORT,CITY',
      'page[limit]': '10'
    });

    const searchUrl = `${AMADEUS_BASE_URL}/v1/reference-data/locations?${params.toString()}`;
    console.log(`Search URL: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.amadeus+json'
      }
    });

    console.log(`Airport search response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ errors: [] }));
      console.error(`Airport search error: ${JSON.stringify(errorData)}`);
      return res.status(response.status).json({
        ok: false,
        error: errorData.errors?.[0]?.detail || 'Airport search failed'
      });
    }

    const data = await response.json();
    console.log(`Airport search success, found ${data.data?.length || 0} results`);
    
    const airports = (data.data || []).map(loc => ({
      city: loc.address?.cityName || loc.name,
      name: loc.name,
      code: loc.iataCode || loc.id,
      country: loc.address?.countryName
    }));

    res.json({
      ok: true,
      airports
    });

  } catch (error) {
    console.error('Error searching airports:', error);
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
    const offerRequestData = {
      data: {
        slices: [
          {
            origin: {
              type: 'airport',
              iata_code: originLocationCode
            },
            destination: {
              type: 'airport', 
              iata_code: destinationLocationCode
            },
            departure_date: departureDate
          }
        ],
        passengers: [
          {
            type: 'adult',
            count: adults
          }
        ],
        cabin_class: travelClass.toLowerCase()
      }
    };

    // Add return flight if specified
    if (returnDate) {
      offerRequestData.data.slices.push({
        origin: {
          type: 'airport',
          iata_code: destinationLocationCode
        },
        destination: {
          type: 'airport',
          iata_code: originLocationCode
        },
        departure_date: returnDate
      });
    }

    // Add children if specified
    if (children > 0) {
      offerRequestData.data.passengers.push({
        type: 'child',
        count: children
      });
    }

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

    // Step 2: Get offers for the request
    const offersResponse = await fetch(
      `${DUFFEL_BASE_URL}/air/offers?offer_request_id=${offerRequestId}&limit=${max}&sort=total_amount`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Duffel-Version': 'v2',
          'Authorization': `Bearer ${DUFFEL_API_KEY}`
        }
      }
    );

    if (!offersResponse.ok) {
      const error = await offersResponse.text();
      console.error('Duffel offers failed:', error);
      return res.status(offersResponse.status).json({
        ok: false,
        error: `Duffel offers failed: ${error}`
      });
    }

    const offersData = await offersResponse.json();
    const offers = offersData.data || [];

    console.log(`Found ${offers.length} Duffel offers`);

    // Transform Duffel offers to our format
    const flights = offers.slice(0, max).map((offer, index) => {
      const slice = offer.slices?.[0] || {};
      const segment = slice.segments?.[0] || {};
      
      // Calculate duration from first departure to last arrival
      let durationMin = 120; // default
      if (slice.duration) {
        // Parse PT02H26M format to minutes
        const match = slice.duration.match(/PT(\d+)H)?(\d+)M?/);
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
      let arriveTime = '00:00';
      if (segment.departing_at) {
        departTime = new Date(segment.departing_at).toTimeString().substring(0, 5);
      }
      if (segment.arriving_at) {
        arriveTime = new Date(segment.arriving_at).toTimeString().substring(0, 5);
      }

      // Count stops (segments - 1)
      const stops = Math.max(0, (slice.segments?.length || 1) - 1);

      // Get price
      const price = parseFloat(offer.total_amount) || 299;

      return {
        id: `DF-${index}-${Date.now()}`,
        airline: {
          code: airlineCode,
          name: airline.name || 'Duffel Airline',
          logo: airlineCode.substring(0, 2).toUpperCase()
        },
        departTime,
        arriveTime,
        durationMin,
        stops,
        price: Math.round(price * 1.1), // Small markup for comparison
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
        source: 'duffel',
        offer_request_id: offerRequestId
      }
    });

  } catch (error) {
    console.error('Error searching Duffel flights:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      ok: false,
      error: error.message || 'Internal server error'
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
    // Return common airports that match the keyword
    const commonAirports = [
      { city: "New York", name: "John F. Kennedy International", code: "JFK", country: "United States" },
      { city: "Los Angeles", name: "Los Angeles International", code: "LAX", country: "United States" },
      { city: "London", name: "Heathrow", code: "LHR", country: "United Kingdom" },
      { city: "Paris", name: "Charles de Gaulle", code: "CDG", country: "France" },
      { city: "Tokyo", name: "Haneda", code: "HND", country: "Japan" },
      { city: "Dubai", name: "Dubai International", code: "DXB", country: "UAE" },
      { city: "Singapore", name: "Changi", code: "SIN", country: "Singapore" },
      { city: "Hong Kong", name: "Hong Kong International", code: "HKG", country: "Hong Kong" },
      { city: "Amsterdam", name: "Schiphol", code: "AMS", country: "Netherlands" },
      { city: "Frankfurt", name: "Frankfurt Airport", code: "FRA", country: "Germany" }
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

// Eventbrite API endpoints
app.get('/api/events/status', async (req, res) => {
  try {
    if (!EVENTBRITE_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Eventbrite API is not configured (missing EVENTBRITE_TOKEN)' });
    }

    // Test API with a simple request
    const response = await fetch('https://www.eventbriteapi.com/v3/users/me/', {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(401).json({ ok: false, error: 'Invalid Eventbrite token' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error && error.message ? error.message : 'Server error' });
  }
});

app.get('/api/events/organizations', async (req, res) => {
  try {
    if (!EVENTBRITE_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Eventbrite API is not configured (missing EVENTBRITE_TOKEN)' });
    }

    const response = await fetch('https://www.eventbriteapi.com/v3/users/me/organizations/', {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        ok: false,
        error: errorData.error_description || errorData.error || `HTTP ${response.status}`
      });
    }

    const data = await response.json();
    return res.status(200).json({ ok: true, organizations: data.organizations || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error && error.message ? error.message : 'Server error' });
  }
});

app.get('/api/events/search', async (req, res) => {
  try {
    if (!EVENTBRITE_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Eventbrite API is not configured (missing EVENTBRITE_TOKEN)' });
    }

    const location = String(req.query.location || '').trim();
    if (!location) {
      return res.status(422).json({ ok: false, error: 'Missing required query param: location' });
    }

    const locationLc = location.toLowerCase();

    // 1) Get organizations for this token
    const orgRes = await fetch('https://www.eventbriteapi.com/v3/users/me/organizations/', {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!orgRes.ok) {
      const errorData = await orgRes.json().catch(() => ({}));
      return res.status(orgRes.status).json({
        ok: false,
        error: errorData.error_description || errorData.error || `HTTP ${orgRes.status}`
      });
    }

    const orgJson = await orgRes.json();
    const organizations = orgJson.organizations || [];
    if (!organizations.length) {
      return res.status(200).json({ ok: true, events: [] });
    }

    // 2) Aggregate events across organizations and filter by venue location
    const maxResults = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10) || 20, 1), 50);
    const events = [];

    // Keep this conservative to avoid hitting rate limits.
    for (const org of organizations.slice(0, 10)) {
      if (events.length >= maxResults) break;

      const orgId = String(org.id || '').trim();
      if (!orgId) continue;

      const url = `https://www.eventbriteapi.com/v3/organizations/${orgId}/events/?status=live&order_by=start_asc&page_size=50&expand=venue`;
      const evRes = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!evRes.ok) {
        // Ignore a single org failure and continue.
        continue;
      }

      const evJson = await evRes.json().catch(() => ({}));
      const orgEvents = evJson.events || [];
      for (const ev of orgEvents) {
        if (events.length >= maxResults) break;
        const v = ev && ev.venue ? ev.venue : null;
        const addr = v && v.address ? v.address : null;
        const city = String(addr && addr.city ? addr.city : '').toLowerCase();
        const region = String(addr && addr.region ? addr.region : '').toLowerCase();
        const country = String(addr && addr.country ? addr.country : '').toLowerCase();
        const venueName = String(v && v.name ? v.name : '').toLowerCase();

        const haystack = `${venueName} ${city} ${region} ${country}`.trim();
        if (haystack.includes(locationLc)) {
          events.push(ev);
        }
      }
    }

    return res.status(200).json({ ok: true, events });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error && error.message ? error.message : 'Server error' });
  }
});

app.get('/api/events/organizations/:orgId/events', async (req, res) => {
  try {
    if (!EVENTBRITE_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Eventbrite API is not configured (missing EVENTBRITE_TOKEN)' });
    }

    const { orgId } = req.params;
    const { page_size = '20', expand = 'venue' } = req.query;

    // Build Eventbrite API URL for organization events
    let apiUrl = `https://www.eventbriteapi.com/v3/organizations/${orgId}/events/?`;
    const params = new URLSearchParams();

    params.append('page_size', page_size);
    if (expand) params.append('expand', expand);
    params.append('status', 'live'); // Only show live events
    params.append('order_by', 'start_desc'); // Show upcoming events first

    apiUrl += params.toString();

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        ok: false, 
        error: errorData.error_description || errorData.error || `HTTP ${response.status}` 
      });
    }

    const data = await response.json();
    return res.status(200).json({ ok: true, events: data.events || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error && error.message ? error.message : 'Server error' });
  }
});

app.get('/api/events/venues/:venueId/events', async (req, res) => {
  try {
    if (!EVENTBRITE_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Eventbrite API is not configured (missing EVENTBRITE_TOKEN)' });
    }

    const { venueId } = req.params;
    const { page_size = '20', expand = 'venue' } = req.query;

    // Build Eventbrite API URL for venue events
    let apiUrl = `https://www.eventbriteapi.com/v3/venues/${venueId}/events/?`;
    const params = new URLSearchParams();

    params.append('page_size', page_size);
    if (expand) params.append('expand', expand);
    params.append('status', 'live'); // Only show live events
    params.append('order_by', 'start_desc'); // Show upcoming events first

    apiUrl += params.toString();

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        ok: false, 
        error: errorData.error_description || errorData.error || `HTTP ${response.status}` 
      });
    }

    const data = await response.json();
    return res.status(200).json({ ok: true, events: data.events || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error && error.message ? error.message : 'Server error' });
  }
});

// Note: The public search endpoint was deprecated in 2020
// This endpoint provides a demo using a sample organization
app.get('/api/events/demo', async (req, res) => {
  try {
    if (!EVENTBRITE_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Eventbrite API is not configured (missing EVENTBRITE_TOKEN)' });
    }

    // Use Eventbrite's official organization for demo events
    const response = await fetch('https://www.eventbriteapi.com/v3/organizations/17572926663/events/?status=live&order_by=start_desc&page_size=20&expand=venue', {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        ok: false, 
        error: errorData.error_description || errorData.error || `HTTP ${response.status}` 
      });
    }

    const data = await response.json();
    return res.status(200).json({ ok: true, events: data.events || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error && error.message ? error.message : 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`BookingCart server running on http://localhost:${PORT}`);
  console.log(`Amadeus environment: ${AMADEUS_ENV}`);
  console.log(`Amadeus API Key configured: ${!!AMADEUS_API_KEY}`);
  console.log(`Amadeus API Secret configured: ${!!AMADEUS_API_SECRET}`);
  console.log(`Duffel API Key configured: ${!!DUFFEL_API_KEY}`);
  console.log(`Eventbrite Token configured: ${!!EVENTBRITE_TOKEN}`);
  
  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.warn('⚠️  WARNING: Amadeus API credentials not configured!');
    console.warn('   Set AMADEUS_API_KEY and AMADEUS_API_SECRET environment variables.');
  }
  
  if (!DUFFEL_API_KEY) {
    console.warn('⚠️  WARNING: Duffel API key not configured!');
    console.warn('   Set DUFFEL_API_KEY environment variable to use Duffel API.');
  }
  
  if (!EVENTBRITE_TOKEN) {
    console.warn('⚠️  WARNING: Eventbrite token not configured!');
    console.warn('   Set EVENTBRITE_TOKEN environment variable to use Eventbrite API.');
  }
  
  if (AMADEUS_API_KEY && AMADEUS_API_SECRET && DUFFEL_API_KEY && EVENTBRITE_TOKEN) {
    console.log('🎉 All APIs are configured! (Amadeus, Duffel, Eventbrite)');
    console.log('   Your website can now show real flights, stays, and events.');
  }
});
