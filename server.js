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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Cache for access token (not needed for Duffel, but keeping for future use)
let accessToken = null;
let tokenExpiry = null;

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

    // Get access token
    const token = await getDuffelToken();

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

    console.log(`Searching flights with params: ${params.toString()}`);

    // Call Duffel Flight Offers Search API (GET version)
    const response = await fetch(
      `${DUFFEL_BASE_URL}/v1/offers?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.duffel+json'
        }
      }
    );

    console.log(`Flight search response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ errors: [] }));
      const errorMsg = errorData.errors?.[0]?.detail || `Duffel API error: ${response.status}`;
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
      transformDuffelOffer(offer, index)
    );

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
    let offerRequestData = {
            destination_type: "airport", 
            destination: destinationAirport,
            departure_date: departureDate
          }
        ],
        passengers: [
          {
            type: "adult",
            count: adults
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
          logo: airlineCode.substring(0, 2).toUpperCase()
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
