const fetch = require("node-fetch");
const Stripe = require("stripe");

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || "";
const DUFFEL_BASE_URL = "https://api.duffel.com";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const stripe = STRIPE_SECRET_KEY ? Stripe(STRIPE_SECRET_KEY) : null;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };
}

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

function getOrigin(headers) {
  const proto = headers["x-forwarded-proto"] || "https";
  const host = headers["x-forwarded-host"] || headers.host;
  if (!host) return "";
  return `${proto}://${host}`;
}

function normalizeRoute(path) {
  const p = String(path || "");
  const idx = p.indexOf("/.netlify/functions/api");
  if (idx !== -1) {
    const rest = p.slice(idx + "/.netlify/functions/api".length);
    return rest.replace(/^\/+/, "");
  }
  const idx2 = p.indexOf("/api/");
  if (idx2 !== -1) {
    return p.slice(idx2 + "/api/".length).replace(/^\/+/, "");
  }
  return p.replace(/^\/+/, "");
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

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
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
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

async function handleDuffelSearch(event) {
  if (!DUFFEL_API_KEY) {
    return json(500, { ok: false, error: "Duffel is not configured (missing DUFFEL_API_KEY)" });
  }

  const payload = safeJsonParse(event.body || "{}") || {};
  const {
    originLocationCode,
    destinationLocationCode,
    departureDate,
    returnDate,
    adults = 1,
    children = 0,
    infants = 0,
    travelClass = "ECONOMY",
    max = 30
  } = payload;

  if (!originLocationCode || !destinationLocationCode || !departureDate) {
    return json(400, {
      ok: false,
      error: "Missing required parameters: originLocationCode, destinationLocationCode, departureDate"
    });
  }

  const offerRequestData = {
    data: {
      slices: [
        {
          origin: String(originLocationCode),
          destination: String(destinationLocationCode),
          departure_date: String(departureDate)
        }
      ],
      passengers: [
        {
          type: "adult",
          count: adults
        }
      ],
      cabin_class: String(travelClass).toLowerCase()
    }
  };

  if (children > 0) {
    offerRequestData.data.passengers.push({ type: "child", count: children });
  }
  if (infants > 0) {
    offerRequestData.data.passengers.push({ type: "infant", count: infants });
  }

  if (returnDate) {
    offerRequestData.data.slices.push({
      origin: String(destinationLocationCode),
      destination: String(originLocationCode),
      departure_date: String(returnDate)
    });
  }

  const createResponse = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${DUFFEL_API_KEY}`
    },
    body: JSON.stringify(offerRequestData)
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    return json(createResponse.status, { ok: false, error: `Duffel offer request failed: ${error}` });
  }

  const createData = await createResponse.json();
  const offerRequestId = createData?.data?.id;
  if (!offerRequestId) {
    return json(500, { ok: false, error: "Failed to create offer request" });
  }

  const offersResponse = await fetch(
    `${DUFFEL_BASE_URL}/air/offers?offer_request_id=${encodeURIComponent(offerRequestId)}&limit=${encodeURIComponent(
      max
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Duffel-Version": "v2",
        Authorization: `Bearer ${DUFFEL_API_KEY}`
      }
    }
  );

  if (!offersResponse.ok) {
    const errorData = await offersResponse.json().catch(() => ({ errors: [] }));
    const errorMsg = errorData.errors?.[0]?.detail || `Duffel offers failed: ${offersResponse.status}`;
    return json(offersResponse.status, { ok: false, error: errorMsg });
  }

  const offersData = await offersResponse.json();
  const offersRaw = Array.isArray(offersData?.data) ? offersData.data : [];

  const offers = [];
  const seenOfferIds = new Set();
  for (const o of offersRaw) {
    const oid = o && o.id ? String(o.id) : "";
    if (oid && seenOfferIds.has(oid)) continue;
    if (oid) seenOfferIds.add(oid);
    offers.push(o);
  }

  const flights = offers.slice(0, max).map((offer, index) => {
    const slice0 = offer.slices?.[0] || {};
    const slice1 = offer.slices?.[1] || null;

    const out = summarizeSlice(slice0);
    const ret = slice1 ? summarizeSlice(slice1) : null;

    const segment = out.segments?.[0] || {};

    const owner = offer.owner || {};
    const marketingCarrier = segment.marketing_carrier || {};
    const operatingCarrier = segment.operating_carrier || {};
    const airlineCode =
      owner.iata_code || marketingCarrier.iata_code || operatingCarrier.iata_code || "DF";
    const airlineName = owner.name || marketingCarrier.name || operatingCarrier.name || airlineCode;
    const airlineLogoUrl = owner.logo_symbol_url || owner.logo_lockup_url || "";

    let price = 0;
    if (offer.total_amount) {
      price = parseFloat(String(offer.total_amount).replace(/[^\d.]/g, "")) || 0;
    }

    return {
      id: offer.id ? String(offer.id) : `DF-${index}-${Date.now()}`,
      airline: {
        code: airlineCode,
        name: airlineName,
        logo: airlineCode.substring(0, 2).toUpperCase(),
        logoUrl: airlineLogoUrl
      },
      departTime: out.departTime,
      arriveTime: out.arriveTime,
      durationMin: out.durationMin,
      stops: out.stops,
      returnDepartTime: ret ? ret.departTime : "",
      returnArriveTime: ret ? ret.arriveTime : "",
      returnDurationMin: ret ? ret.durationMin : 0,
      returnStops: ret ? ret.stops : 0,
      price: Math.round(price),
      segments:
        out.segments?.map((seg) => ({
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
      returnSegments: ret
        ? (ret.segments || []).map((seg) => ({
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
          }))
        : [],
      _duffelOffer: offer
    };
  });

  return json(200, {
    ok: true,
    flights,
    meta: {
      count: flights.length,
      total: offers.length,
      source: "duffel"
    }
  });
}

async function handleDuffelAirports(event) {
  if (!DUFFEL_API_KEY) {
    return json(500, { ok: false, error: "Duffel is not configured (missing DUFFEL_API_KEY)" });
  }

  const keyword = String(event.queryStringParameters?.keyword || "");
  if (!keyword || keyword.length < 2) {
    return json(200, { ok: true, airports: [] });
  }

  const resp = await fetch(
    `${DUFFEL_BASE_URL}/places/suggestions?query=${encodeURIComponent(keyword)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Duffel-Version": "v2",
        Authorization: `Bearer ${DUFFEL_API_KEY}`
      }
    }
  );

  if (!resp.ok) {
    const error = await resp.text();
    return json(resp.status, { ok: false, error });
  }

  const data = await resp.json();
  const suggestions = Array.isArray(data?.data) ? data.data : [];

  const airports = [];

  suggestions.forEach((s) => {
    if (!s || !s.type) return;

    if (s.type === "airport" && s.iata_code) {
      airports.push({
        city: s.city_name || s.city?.name || "",
        name: s.name || "",
        code: s.iata_code,
        country: s.iata_country_code || s.country_name || ""
      });
      return;
    }

    if (s.type === "city" && Array.isArray(s.airports)) {
      s.airports.forEach((a) => {
        if (!a || !a.iata_code) return;
        airports.push({
          city: s.name || s.city_name || "",
          name: a.name || "",
          code: a.iata_code,
          country: a.iata_country_code || s.iata_country_code || ""
        });
      });
    }
  });

  const unique = [];
  const seen = new Set();
  airports.forEach((a) => {
    if (!a.code || seen.has(a.code)) return;
    seen.add(a.code);
    unique.push(a);
  });

  return json(200, { ok: true, airports: unique.slice(0, 10) });
}

async function handleStripeCreateSession(event) {
  if (!stripe) {
    return json(500, { ok: false, error: "Stripe is not configured (missing STRIPE_SECRET_KEY)" });
  }

  const payload = safeJsonParse(event.body || "{}") || {};
  const {
    amountCents,
    currency = "usd",
    description = "BookingCart booking",
    bookingRef = "",
    successPath = "/confirmation.html",
    cancelPath = "/payment.html"
  } = payload;

  const unitAmount = Math.round(Number(amountCents));
  if (!Number.isFinite(unitAmount) || unitAmount < 50) {
    return json(400, { ok: false, error: "Invalid amountCents" });
  }

  const origin = event.headers?.origin || getOrigin(event.headers || {});
  if (!origin) {
    return json(500, { ok: false, error: "Unable to determine site origin" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
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

  return json(200, { ok: true, id: session.id, url: session.url });
}

async function handleStripeSession(event) {
  if (!stripe) {
    return json(500, { ok: false, error: "Stripe is not configured (missing STRIPE_SECRET_KEY)" });
  }

  const sessionId = String(event.queryStringParameters?.session_id || "");
  if (!sessionId) {
    return json(400, { ok: false, error: "Missing session_id" });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return json(200, {
    ok: true,
    id: session.id,
    status: session.status,
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    currency: session.currency
  });
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders()
        },
        body: ""
      };
    }

    const route = normalizeRoute(event.path);

    if (route === "duffel-search" && event.httpMethod === "POST") {
      return await handleDuffelSearch(event);
    }

    if (route === "duffel-airports" && event.httpMethod === "GET") {
      return await handleDuffelAirports(event);
    }

    if (route === "stripe/create-checkout-session" && event.httpMethod === "POST") {
      return await handleStripeCreateSession(event);
    }

    if (route === "stripe/session" && event.httpMethod === "GET") {
      return await handleStripeSession(event);
    }

    return json(404, { ok: false, error: "Not found" });
  } catch (error) {
    return json(500, { ok: false, error: error && error.message ? error.message : "Server error" });
  }
};
