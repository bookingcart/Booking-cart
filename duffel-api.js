// Duffel API Integration for BookingCart
// Modern flight API with comprehensive data

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();

// Duffel API configuration
const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';

/**
 * Get Duffel access token (if needed for future use)
 */
async function getDuffelToken() {
  // Duffel uses API key directly in headers for now
  // This function is prepared for future authentication changes
  return DUFFEL_API_KEY;
}

/**
 * Transform Duffel offer to our frontend format
 */
function transformDuffelOffer(offer, index) {
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
  const currency = offer.total_currency || 'USD';

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
    currency,
    // Store full offer for later use
    _duffelOffer: offer
  };
}

/**
 * Create offer request and get flight offers
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
        'Authorization': `Bearer ${await getDuffelToken()}`
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
          'Authorization': `Bearer ${await getDuffelToken()}`
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

console.log('🛫 Duffel API integration ready');
console.log('Add DUFFEL_API_KEY to your .env file to use this API');
console.log('Get free API key at: https://app.duffel.com/join');

module.exports = app;
