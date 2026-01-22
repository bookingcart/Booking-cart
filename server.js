// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables for Duffel API only
const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';

// Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = STRIPE_SECRET_KEY ? Stripe(STRIPE_SECRET_KEY) : null;

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
 * NOTE: This is the main endpoint - the duplicate below should be removed
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

    // Duffel doesn't need token management like Amadeus
    // Use API key directly in headers

    console.log(`Duffel search: ${originLocationCode} → ${destinationLocationCode} on ${departureDate}`);

    // Create offer request - Duffel accepts IATA codes directly as strings
    const offerRequestData = {
      data: {
        slices: [
          {
            origin: originLocationCode,  // IATA code as string
            destination: destinationLocationCode,  // IATA code as string
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
    
    // Add children and infants if specified
    if (children > 0) {
      offerRequestData.data.passengers.push({
        type: "child",
        count: children
      });
    }
    if (infants > 0) {
      offerRequestData.data.passengers.push({
        type: "infant",
        count: infants
      });
    }
    
    // Add return slice if round trip
    if (returnDate) {
      offerRequestData.data.slices.push({
        origin: destinationLocationCode,
        destination: originLocationCode,
        departure_date: returnDate
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

    // Step 3: Get offers for this request
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
    const offersRaw = offersData.data || [];

    // De-dupe offers (Duffel can sometimes return duplicates)
    const offers = [];
    const seenOfferIds = new Set();
    for (const o of offersRaw) {
      const oid = o && o.id ? String(o.id) : "";
      if (oid && seenOfferIds.has(oid)) continue;
      if (oid) seenOfferIds.add(oid);
      offers.push(o);
    }

    console.log(`Found ${offers.length} Duffel flight offers`);

    function parseDurationToMinutes(duration) {
      if (!duration) return 120;
      const match = String(duration).match(/PT(\d+)H?(\d+)M?/);
      if (!match) return 120;
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      return hours * 60 + minutes;
    }

    function toTimeHHmm(iso) {
      if (!iso) return "00:00";
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function summarizeSlice(slice) {
      const segments = Array.isArray(slice?.segments) ? slice.segments : [];
      const first = segments[0] || {};
      const last = segments[segments.length - 1] || first;

      return {
        departTime: toTimeHHmm(first.departing_at),
        arriveTime: toTimeHHmm(last.arriving_at),
        durationMin: parseDurationToMinutes(slice?.duration),
        stops: Math.max(0, segments.length - 1),
        segments
      };
    }

    // Transform offers to our format
    const flights = offers.slice(0, max).map((offer, index) => {
      const slice0 = offer.slices?.[0] || {};
      const slice1 = offer.slices?.[1] || null;

      const out = summarizeSlice(slice0);
      const ret = slice1 ? summarizeSlice(slice1) : null;

      const segment = (out.segments?.[0]) || {};
      
      // Use slice summary (first+last segment) so results don't appear identical
      const durationMin = out.durationMin;

      // Get airline info
      // Prefer offer.owner (validating airline) which includes logo URLs
      const owner = offer.owner || {};
      const marketingCarrier = segment.marketing_carrier || {};
      const operatingCarrier = segment.operating_carrier || {};
      const airlineCode = owner.iata_code || marketingCarrier.iata_code || operatingCarrier.iata_code || 'DF';
      const airlineName = owner.name || marketingCarrier.name || operatingCarrier.name || airlineCode;
      const airlineLogoUrl = owner.logo_symbol_url || owner.logo_lockup_url || '';
      
      const departTime = out.departTime;
      const arriveTime = out.arriveTime;

      // Count stops (segments - 1)
      const stops = out.stops;

      // Get price - Duffel returns total_amount as string with currency
      let price = 0;
      if (offer.total_amount) {
        price = parseFloat(String(offer.total_amount).replace(/[^\d.]/g, '')) || 0;
      } else if (offer.total_currency && offer.total_amount) {
        price = parseFloat(offer.total_amount) || 0;
      }

      return {
        id: offer.id ? String(offer.id) : `DF-${index}-${Date.now()}`,
        airline: {
          code: airlineCode,
          name: airlineName,
          logo: airlineCode.substring(0, 2).toUpperCase(),
          logoUrl: airlineLogoUrl
        },
        departTime,
        arriveTime,
        durationMin,
        stops,
        returnDepartTime: ret ? ret.departTime : "",
        returnArriveTime: ret ? ret.arriveTime : "",
        returnDurationMin: ret ? ret.durationMin : 0,
        returnStops: ret ? ret.stops : 0,
        price: Math.round(price),  // Round to nearest dollar
        segments: out.segments?.map(seg => ({
          departure: {
            iataCode: seg.origin?.iata_code || seg.origin?.iata,
            at: seg.departing_at
          },
          arrival: {
            iataCode: seg.destination?.iata_code || seg.destination?.iata,
            at: seg.arriving_at
          },
          carrierCode: seg.marketing_carrier?.iata_code || seg.operating_carrier?.iata_code,
          number: seg.marketing_carrier_flight_number || seg.flight_number,
          duration: seg.duration
        })) || [],
        returnSegments: ret ? (ret.segments || []).map(seg => ({
          departure: {
            iataCode: seg.origin?.iata_code || seg.origin?.iata,
            at: seg.departing_at
          },
          arrival: {
            iataCode: seg.destination?.iata_code || seg.destination?.iata,
            at: seg.arriving_at
          },
          carrierCode: seg.marketing_carrier?.iata_code || seg.operating_carrier?.iata_code,
          number: seg.marketing_carrier_flight_number || seg.flight_number,
          duration: seg.duration
        })) : [],
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
 * Stripe Checkout Session creation
 */
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ ok: false, error: 'Stripe is not configured (missing STRIPE_SECRET_KEY)' });
    }

    const {
      amountCents,
      currency = 'usd',
      description = 'BookingCart booking',
      bookingRef = '',
      successPath = '/confirmation.html',
      cancelPath = '/payment.html'
    } = req.body || {};

    const unitAmount = Math.round(Number(amountCents));
    if (!Number.isFinite(unitAmount) || unitAmount < 50) {
      return res.status(400).json({ ok: false, error: 'Invalid amountCents' });
    }

    const origin = req.headers.origin || `http://localhost:${PORT}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: String(currency).toLowerCase(),
            product_data: { name: String(description).slice(0, 120) },
            unit_amount: Math.round(unitAmount)
          },
          quantity: 1
        }
      ],
      client_reference_id: bookingRef ? String(bookingRef).slice(0, 64) : undefined,
      success_url: `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}?canceled=1`
    });

    return res.json({ ok: true, id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe create session error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Stripe error' });
  }
});

/**
 * Stripe Checkout Session lookup (for confirmation verification)
 */
app.get('/api/stripe/session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ ok: false, error: 'Stripe is not configured (missing STRIPE_SECRET_KEY)' });
    }

    const sessionId = String(req.query.session_id || '');
    if (!sessionId) {
      return res.status(400).json({ ok: false, error: 'Missing session_id' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return res.json({
      ok: true,
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency
    });
  } catch (error) {
    console.error('Stripe session lookup error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Stripe error' });
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

    const resp = await fetch(`${DUFFEL_BASE_URL}/places/suggestions?query=${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      }
    });

    if (!resp.ok) {
      const error = await resp.text();
      return res.status(resp.status).json({ ok: false, error });
    }

    const data = await resp.json();
    const suggestions = Array.isArray(data.data) ? data.data : [];

    const airports = [];

    suggestions.forEach((s) => {
      if (!s || !s.type) return;

      if (s.type === 'airport' && s.iata_code) {
        airports.push({
          city: s.city_name || s.city?.name || '',
          name: s.name || '',
          code: s.iata_code,
          country: s.iata_country_code || s.country_name || ''
        });
        return;
      }

      if (s.type === 'city' && Array.isArray(s.airports)) {
        s.airports.forEach((a) => {
          if (!a || !a.iata_code) return;
          airports.push({
            city: s.name || s.city_name || '',
            name: a.name || '',
            code: a.iata_code,
            country: a.iata_country_code || s.iata_country_code || ''
          });
        });
      }
    });

    // De-dupe by IATA
    const unique = [];
    const seen = new Set();
    airports.forEach((a) => {
      if (!a.code || seen.has(a.code)) return;
      seen.add(a.code);
      unique.push(a);
    });

    res.json({ ok: true, airports: unique.slice(0, 10) });

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
