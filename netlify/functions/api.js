const fetch = require("node-fetch");
const Stripe = require("stripe");
const crypto = require("crypto");

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || "";
const DUFFEL_BASE_URL = "https://api.duffel.com";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const stripe = STRIPE_SECRET_KEY ? Stripe(STRIPE_SECRET_KEY) : null;

const VISA_ADMIN_TOKEN = process.env.VISA_ADMIN_TOKEN || "";

const TRAVELBUDDY_RAPIDAPI_SECRET = process.env.TRAVELBUDDY_RAPIDAPI_SECRET || process.env.RAPIDAPI_SECRET || "";
const TRAVELBUDDY_API_BASE = "https://visa-requirement.p.rapidapi.com";

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_OWNER = process.env.GITHUB_OWNER || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_API_BASE = "https://api.github.com";

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

function requireTravelBuddy(event) {
  if (!TRAVELBUDDY_RAPIDAPI_SECRET) {
    return { ok: false, status: 500, error: "Travel Buddy API is not configured (missing TRAVELBUDDY_RAPIDAPI_SECRET)" };
  }
  return { ok: true };
}

async function travelBuddyPost(path, body) {
  const url = `${TRAVELBUDDY_API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Proxy-Secret": TRAVELBUDDY_RAPIDAPI_SECRET
    },
    body: JSON.stringify(body || {})
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, bodyText: text };
  }
  try {
    return { ok: true, status: res.status, json: JSON.parse(text) };
  } catch {
    return { ok: false, status: 502, bodyText: "Invalid JSON from upstream" };
  }
}

async function handleTravelBuddyVisaCheck(event) {
  const gate = requireTravelBuddy(event);
  if (!gate.ok) return json(gate.status, { ok: false, error: gate.error });

  const payload = safeJsonParse(event.body || "{}") || {};
  const passport = String(payload.passport || "").trim().toUpperCase();
  const destination = String(payload.destination || "").trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(passport) || !/^[A-Z]{2}$/.test(destination)) {
    return json(422, { ok: false, error: "Invalid parameters. Expected ISO2 codes for passport and destination." });
  }
  if (passport === destination) {
    return json(422, { ok: false, error: "passport and destination must be different" });
  }

  const upstream = await travelBuddyPost("/v2/visa/check", { passport, destination });
  if (!upstream.ok) {
    return json(upstream.status || 502, { ok: false, error: "Upstream error", details: upstream.bodyText || "" });
  }

  return json(200, { ok: true, data: upstream.json });
}

async function handleTravelBuddyVisaMap(event) {
  const gate = requireTravelBuddy(event);
  if (!gate.ok) return json(gate.status, { ok: false, error: gate.error });

  const payload = safeJsonParse(event.body || "{}") || {};
  const passport = String(payload.passport || "").trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(passport)) {
    return json(422, { ok: false, error: "Invalid parameters. Expected ISO2 code for passport." });
  }

  const upstream = await travelBuddyPost("/v2/visa/map", { passport });
  if (!upstream.ok) {
    return json(upstream.status || 502, { ok: false, error: "Upstream error", details: upstream.bodyText || "" });
  }

  return json(200, { ok: true, data: upstream.json });
}

function requireVisaAdmin(event) {
  if (!VISA_ADMIN_TOKEN) {
    return { ok: false, status: 500, error: "Visa admin is not configured (missing VISA_ADMIN_TOKEN)" };
  }

  const auth = String(event.headers?.authorization || event.headers?.Authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (!token || token !== VISA_ADMIN_TOKEN) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  return { ok: true };
}

// GitHub API helpers
function githubHeaders() {
  return {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "BookingCart-Visa"
  };
}

async function githubCreateOrUpdateFile(path, content, message = "Update visa application") {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error("GitHub storage is not configured");
  }
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const body = {
    message,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64")
  };
  // Try to create; if file exists, get sha first
  try {
    const getRes = await fetch(url, { headers: githubHeaders() });
    if (getRes.ok) {
      const existing = await getRes.json();
      body.sha = existing.sha;
    }
  } catch {
    // ignore
  }
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...githubHeaders() },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }
  return await res.json();
}

async function githubGetFile(path) {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error("GitHub storage is not configured");
  }
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) {
    if (res.status === 404) return null;
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }
  const data = await res.json();
  return JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
}

async function githubListFiles(prefix = "") {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error("GitHub storage is not configured");
  }
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${prefix}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) {
    if (res.status === 404) return [];
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function randomId(prefix) {
  if (crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

 function normCountry(s) {
   return String(s || "")
     .trim()
     .toLowerCase();
 }

 const VISA_FREE_GROUP = new Set(
   ["Mauritius", "Seychelles", "Barbados", "Bahamas", "Fiji"].map(normCountry)
 );

function visaRules() {
  return {
    "United Arab Emirates": {
      tourism: { type: "eVisa", governmentFee: 95, documents: ["Passport bio page", "Passport photo", "Accommodation details", "Return ticket (recommended)"] },
      business: { type: "eVisa", governmentFee: 125, documents: ["Passport bio page", "Passport photo", "Invitation letter (if applicable)"] },
      transit: { type: "Visa-free / Transit rules", governmentFee: 0, documents: ["Valid passport", "Onward ticket"] }
    },
    Turkey: {
      tourism: { type: "eVisa", governmentFee: 60, documents: ["Passport bio page", "Passport photo"] },
      business: { type: "eVisa", governmentFee: 75, documents: ["Passport bio page", "Passport photo"] },
      transit: { type: "Visa-free / Transit rules", governmentFee: 0, documents: ["Valid passport", "Onward ticket"] }
    },
    Kenya: {
      tourism: { type: "eTA", governmentFee: 35, documents: ["Passport bio page", "Passport photo", "Accommodation details", "Return ticket"] },
      business: { type: "eTA", governmentFee: 35, documents: ["Passport bio page", "Passport photo", "Invitation letter (if applicable)"] },
      transit: { type: "Visa-free / Transit rules", governmentFee: 0, documents: ["Valid passport", "Onward ticket"] }
    },
    India: {
      tourism: { type: "eVisa", governmentFee: 40, documents: ["Passport bio page", "Passport photo"] },
      business: { type: "eVisa", governmentFee: 80, documents: ["Passport bio page", "Passport photo", "Business card / invitation (if applicable)"] },
      transit: { type: "Embassy visa", governmentFee: 0, documents: ["Passport bio page", "Passport photo", "Onward ticket"] }
    },
    // Visa-free destinations for many nationalities (examples)
    "Mauritius": {
      tourism: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport", "Proof of funds", "Return/onward ticket"] },
      business: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport", "Proof of funds", "Return/onward ticket"] },
      transit: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport"] }
    },
    "Seychelles": {
      tourism: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport", "Proof of accommodation", "Return/onward ticket"] },
      business: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport", "Proof of accommodation", "Return/onward ticket"] },
      transit: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport"] }
    },
    "Barbados": {
      tourism: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport", "Proof of funds", "Return/onward ticket"] },
      business: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport", "Proof of funds", "Return/onward ticket"] },
      transit: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport"] }
    },
    "Bahamas": {
      tourism: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport", "Proof of funds", "Return/onward ticket"] },
      business: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport", "Proof of funds", "Return/onward ticket"] },
      transit: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport"] }
    },
    "Fiji": {
      tourism: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport", "Proof of funds", "Return/onward ticket"] },
      business: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport", "Proof of funds", "Return/onward ticket"] },
      transit: { type: "Visa-free", governmentFee: 0, documents: ["Valid passport"] }
    }
  };
}

function computeEligibility({ nationality, destination, purpose }) {
  const dest = String(destination || "").trim();
  const nat = String(nationality || "").trim();
  const purp = String(purpose || "tourism").trim();

  if (!dest || !nat) {
    return {
      destination: dest,
      nationality: nat,
      purpose: purp,
      visaType: "Visa required",
      summary: "Please provide nationality and destination.",
      processingOptions: [],
      requiredDocuments: []
    };
  }

  if (dest.toLowerCase() === nat.toLowerCase()) {
    return {
      destination: dest,
      nationality: nat,
      purpose: purp,
      visaType: "Visa-free",
      summary: "Based on your input, you may not need a visa to travel domestically. Confirm with official government guidance.",
      processingOptions: [{ label: "Standard", daysMin: 0, daysMax: 0, governmentFee: 0, serviceFee: 0, note: "No visa required" }],
      requiredDocuments: ["Valid passport"]
    };
  }

  if (VISA_FREE_GROUP.has(normCountry(dest)) && VISA_FREE_GROUP.has(normCountry(nat))) {
    return {
      destination: dest,
      nationality: nat,
      purpose: purp,
      visaType: "Visa-free",
      summary: "Visa-free travel is typically allowed between these countries for short stays. Always confirm with official government guidance before travel.",
      processingOptions: [{ label: "Standard", daysMin: 0, daysMax: 0, governmentFee: 0, serviceFee: 0, note: "No visa required" }],
      requiredDocuments: ["Valid passport", "Return/onward ticket (recommended)"]
    };
  }

  const rules = visaRules();
  const byDest = rules[dest] || null;
  const rule = byDest ? byDest[purp] || byDest.tourism : null;
  const visaType = rule ? rule.type : "Embassy visa";
  const govFee = rule ? Number(rule.governmentFee || 0) : 0;
  const docs = rule ? rule.documents : ["Passport bio page", "Passport photo"];

  const serviceBase = visaType === "Visa-free" ? 0 : 49;
  const serviceRush = visaType === "Visa-free" ? 0 : 89;

  const processingOptions =
    visaType === "Visa-free"
      ? [{ label: "Standard", daysMin: 0, daysMax: 0, governmentFee: 0, serviceFee: 0, note: "No visa required" }]
      : [
          {
            label: "Standard",
            daysMin: visaType === "Embassy visa" ? 10 : 3,
            daysMax: visaType === "Embassy visa" ? 20 : 7,
            governmentFee: govFee,
            serviceFee: serviceBase,
            note: "We prepare, review, and submit your application to the official portal."
          },
          {
            label: "Rush",
            daysMin: visaType === "Embassy visa" ? 7 : 1,
            daysMax: visaType === "Embassy visa" ? 14 : 3,
            governmentFee: govFee,
            serviceFee: serviceRush,
            note: "Prioritized review and submission support. Subject to portal availability."
          }
        ];

  return {
    destination: dest,
    nationality: nat,
    purpose: purp,
    visaType,
    summary: "This is guidance only. Final requirements, fees, and approval are determined by the destination government.",
    processingOptions,
    requiredDocuments: docs
  };
}

async function handleVisaEligibility(event) {
  const payload = safeJsonParse(event.body || "{}") || {};
  const nationality = String(payload.nationality || "");
  const destination = String(payload.destination || "");
  const purpose = String(payload.purpose || "tourism");
  const arrivalDate = String(payload.arrivalDate || "");

  if (!nationality || !destination || !purpose || !arrivalDate) {
    return json(400, { ok: false, error: "Missing required parameters: nationality, destination, purpose, arrivalDate" });
  }

  const result = computeEligibility({ nationality, destination, purpose, arrivalDate });
  return json(200, { ok: true, result });
}

async function handleVisaCreateApplication(event) {
  const payload = safeJsonParse(event.body || "{}") || {};
  const eligibility = payload.eligibility || null;
  if (!eligibility || !eligibility.destination || !eligibility.nationality) {
    return json(400, { ok: false, error: "Missing eligibility" });
  }

  // Try to use GitHub API; if unavailable, fall back to a local-only demo ID
  try {
    const id = randomId("visa");
    const now = new Date().toISOString();
    const application = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "Draft",
      eligibility,
      applicant: {},
      documents: [],
      notesToApplicant: "",
      portalReference: ""
    };
    await githubCreateOrUpdateFile(`visa-applications/${id}.json`, application, `Create visa application ${id}`);
    return json(200, { ok: true, id });
  } catch (e) {
    // Fallback: return a demo ID that the frontend can store locally
    const demoId = randomId("local");
    return json(200, { ok: true, id: demoId, fallback: "local" });
  }
}

async function handleVisaGetApplication(event) {
  const id = String(event.queryStringParameters?.id || "");
  if (!id) return json(400, { ok: false, error: "Missing id" });

  try {
    const application = await githubGetFile(`visa-applications/${id}.json`);
    if (!application) return json(404, { ok: false, error: "Not found" });
    return json(200, { ok: true, application });
  } catch (e) {
    return json(500, { ok: false, error: e && e.message ? e.message : "Failed to fetch application" });
  }
}

async function handleVisaAdminList(event) {
  const auth = requireVisaAdmin(event);
  if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

  try {
    const files = await githubListFiles("visa-applications");
    const apps = [];
    for (const file of files.slice(0, 200)) {
      if (file.type === "file" && file.name.endsWith(".json")) {
        const app = await githubGetFile(file.path);
        if (app) apps.push(app);
      }
    }
    apps.sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
    return json(200, { ok: true, applications: apps });
  } catch (e) {
    return json(500, { ok: false, error: e && e.message ? e.message : "Failed to list applications" });
  }
}

async function handleVisaAdminUpdate(event) {
  const auth = requireVisaAdmin(event);
  if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

  const payload = safeJsonParse(event.body || "{}") || {};
  const id = String(payload.id || "");
  const status = String(payload.status || "");
  const notesToApplicant = String(payload.notesToApplicant || "");

  if (!id) return json(400, { ok: false, error: "Missing id" });

  try {
    const application = await githubGetFile(`visa-applications/${id}.json`);
    if (!application) return json(404, { ok: false, error: "Not found" });

    if (status) application.status = status;
    if (notesToApplicant !== undefined) application.notesToApplicant = notesToApplicant;
    application.updatedAt = new Date().toISOString();

    await githubCreateOrUpdateFile(`visa-applications/${id}.json`, application, `Update visa application ${id}`);
    return json(200, { ok: true, application });
  } catch (e) {
    return json(500, { ok: false, error: e && e.message ? e.message : "Failed to update application" });
  }
}

function parseDurationToMinutes(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(\d+)H(\d+)M?/);
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
        logoUrl: airlineLogoUrl || `https://airline-logos.com/${airlineCode.toLowerCase()}.png`
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

    if (route === "visa/eligibility" && event.httpMethod === "POST") {
      return await handleVisaEligibility(event);
    }

    if (route === "visa/application/create" && event.httpMethod === "POST") {
      return await handleVisaCreateApplication(event);
    }

    if (route === "visa/application" && event.httpMethod === "GET") {
      return await handleVisaGetApplication(event);
    }

    if (route === "visa/admin/applications" && event.httpMethod === "GET") {
      return await handleVisaAdminList(event);
    }

    if (route === "visa/admin/update" && event.httpMethod === "POST") {
      return await handleVisaAdminUpdate(event);
    }

    if (route === "travelbuddy/visa/check" && event.httpMethod === "POST") {
      return await handleTravelBuddyVisaCheck(event);
    }

    if (route === "travelbuddy/visa/map" && event.httpMethod === "POST") {
      return await handleTravelBuddyVisaMap(event);
    }

    return json(404, { ok: false, error: "Not found" });
  } catch (error) {
    return json(500, { ok: false, error: error && error.message ? error.message : "Server error" });
  }
};
