// Load environment variables
require('dotenv').config();

const fetch = require('node-fetch');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';

/**
 * Search flights using Duffel Flight Offers Search API
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
      currencyCode,
      max
    } = req.body;

    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      return res.status(400).json({
        ok: false,
        error: "Missing required parameters: origin, destination, departure date"
      });
    }

    if (!DUFFEL_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Duffel API key not configured"
      });
    }

    console.log(`Searching Duffel flights: ${originLocationCode} → ${destinationLocationCode}`);

    // Build slices array
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

    // Build passengers array
    const passengers = [];
    for (let i = 0; i < (adults || 1); i++) {
      passengers.push({ type: 'adult' });
    }
    for (let i = 0; i < (children || 0); i++) {
      passengers.push({ type: 'child' });
    }
    for (let i = 0; i < (infants || 0); i++) {
      passengers.push({ type: 'infant' });
    }

    // Make request to Duffel API
    const duffelResponse = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v1'
      },
      body: JSON.stringify({
        slices,
        passengers,
        max_connections: (max && parseInt(max) > 0) ? parseInt(max) : 10,
        cabin_class: mapCabinClass(travelClass)
      })
    });

    if (!duffelResponse.ok) {
      const errorText = await duffelResponse.text();
      console.error('Duffel API error:', errorText);
      throw new Error(`Duffel API error: ${duffelResponse.status} ${errorText}`);
    }

    const data = await duffelResponse.json();
    console.log(`Duffel search successful: ${data.data?.length || 0} offers`);

    // Transform to our expected format
    const flights = transformDuffelData(data);

    return res.json({
      ok: true,
      flights,
      total: flights.length
    });

  } catch (error) {
    console.error('Duffel search error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to search flights"
    });
  }
};

function mapCabinClass(travelClass) {
  const c = String(travelClass || "").toLowerCase();
  if (c === "first") return "first";
  if (c === "business") return "business";
  if (c === "premium") return "premium_economy";
  return "economy";
}

function transformDuffelData(data) {
  if (!data.data || !Array.isArray(data.data)) return [];

  return data.data.map((offer) => {
    try {
      const slice = offer.slices?.[0];
      const segment = slice?.segments?.[0];
      const aircraft = segment?.aircraft;
      const owner = segment?.operating_carrier || segment?.marketing_carrier;
      const origin = segment?.origin;
      const destination = segment?.destination;

      if (!origin || !destination || !owner) {
        console.warn('Missing required flight data, skipping offer');
        return null;
      }

      // Calculate times
      const departTime = new Date(origin.departing_at);
      const arriveTime = new Date(destination.arriving_at);
      const durationMs = arriveTime - departTime;
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      return {
        id: offer.id,
        airline: {
          code: owner.iata_code || "DF",
          name: owner.name || "Duffel Airline",
          logo: owner.iata_code?.substring(0, 2).toUpperCase() || "DF",
          logoUrl: owner.logo_symbol_url || owner.logo_lockup_url || ""
        },
        from: {
          city: origin.city_name || origin.iata_code,
          airport: origin.name || origin.iata_code,
          code: origin.iata_code
        },
        to: {
          city: destination.city_name || destination.iata_code,
          airport: destination.name || destination.iata_code,
          code: destination.iata_code
        },
        departTime: departTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        arriveTime: arriveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        departDate: departTime.toLocaleDateString(),
        arriveDate: arriveTime.toLocaleDateString(),
        duration: `${durationHours}h ${durationMins}m`,
        stops: slice?.segments?.length - 1 || 0,
        price: {
          amount: offer.total_amount,
          currency: offer.total_currency
        },
        cabin: offer.cabin_class || "Economy",
        aircraft: aircraft?.iata_code || "Unknown"
      };
    } catch (e) {
      console.error('Error transforming Duffel offer:', e);
      return null;
    }
  }).filter(Boolean);
}
