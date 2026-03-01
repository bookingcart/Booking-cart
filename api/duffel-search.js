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
        'Duffel-Version': 'v2'
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers,
          max_connections: (max && parseInt(max) > 0) ? parseInt(max) : 10,
          cabin_class: mapCabinClass(travelClass)
        }
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
