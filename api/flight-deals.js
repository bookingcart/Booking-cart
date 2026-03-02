// api/flight-deals.js — Top Flight Deals serverless function
//
// Flow:
//  1. Read client IP → ip-api.com → city/country/IATA
//  2. Map city to nearest major airport (IATA code)
//  3. Search Duffel for top routes from that airport
//  4. Cache results in Vercel KV (or global for local dev) for 2 hours
//  5. Return structured deal objects

'use strict';
require('dotenv').config();
const fetch = require('node-fetch');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ── Popular destination routes per origin region ──────────────────────────────
// Each entry: { to, city, country, image (Unsplash keyword) }
const ROUTES = {
    // East Africa
    EBB: [
        { to: 'DXB', city: 'Dubai', country: 'UAE', image: 'dubai' },
        { to: 'LHR', city: 'London', country: 'UK', image: 'london' },
        { to: 'NBO', city: 'Nairobi', country: 'Kenya', image: 'nairobi' },
        { to: 'JNB', city: 'Johannesburg', country: 'South Africa', image: 'johannesburg' },
        { to: 'CAI', city: 'Cairo', country: 'Egypt', image: 'cairo' },
        { to: 'IST', city: 'Istanbul', country: 'Turkey', image: 'istanbul' },
    ],
    NBO: [
        { to: 'DXB', city: 'Dubai', country: 'UAE', image: 'dubai' },
        { to: 'LHR', city: 'London', country: 'UK', image: 'london' },
        { to: 'JNB', city: 'Johannesburg', country: 'South Africa', image: 'johannesburg' },
        { to: 'CDG', city: 'Paris', country: 'France', image: 'paris' },
        { to: 'BOM', city: 'Mumbai', country: 'India', image: 'mumbai' },
    ],
    // Default / Europe / Americas
    LHR: [
        { to: 'JFK', city: 'New York', country: 'USA', image: 'new-york' },
        { to: 'DXB', city: 'Dubai', country: 'UAE', image: 'dubai' },
        { to: 'CDG', city: 'Paris', country: 'France', image: 'paris' },
        { to: 'AMS', city: 'Amsterdam', country: 'Netherlands', image: 'amsterdam' },
        { to: 'SIN', city: 'Singapore', country: 'Singapore', image: 'singapore' },
        { to: 'BKK', city: 'Bangkok', country: 'Thailand', image: 'bangkok' },
    ],
    JFK: [
        { to: 'LHR', city: 'London', country: 'UK', image: 'london' },
        { to: 'CDG', city: 'Paris', country: 'France', image: 'paris' },
        { to: 'CUN', city: 'Cancun', country: 'Mexico', image: 'cancun' },
        { to: 'MIA', city: 'Miami', country: 'USA', image: 'miami' },
        { to: 'LAX', city: 'Los Angeles', country: 'USA', image: 'los-angeles' },
    ],
    DXB: [
        { to: 'LHR', city: 'London', country: 'UK', image: 'london' },
        { to: 'BOM', city: 'Mumbai', country: 'India', image: 'mumbai' },
        { to: 'JFK', city: 'New York', country: 'USA', image: 'new-york' },
        { to: 'SIN', city: 'Singapore', country: 'Singapore', image: 'singapore' },
        { to: 'CDG', city: 'Paris', country: 'France', image: 'paris' },
        { to: 'NBO', city: 'Nairobi', country: 'Kenya', image: 'nairobi' },
    ],
    DEFAULT: [
        { to: 'DXB', city: 'Dubai', country: 'UAE', image: 'dubai' },
        { to: 'LHR', city: 'London', country: 'UK', image: 'london' },
        { to: 'CDG', city: 'Paris', country: 'France', image: 'paris' },
        { to: 'JFK', city: 'New York', country: 'USA', image: 'new-york' },
        { to: 'SIN', city: 'Singapore', country: 'Singapore', image: 'singapore' },
        { to: 'BKK', city: 'Bangkok', country: 'Thailand', image: 'bangkok' },
    ]
};

// City name → IATA airport code mapping
const CITY_TO_IATA = {
    'kampala': 'EBB', 'entebbe': 'EBB',
    'nairobi': 'NBO',
    'dar es salaam': 'DAR',
    'johannesburg': 'JNB', 'joburg': 'JNB',
    'cape town': 'CPT',
    'lagos': 'LOS',
    'accra': 'ACC',
    'cairo': 'CAI',
    'dubai': 'DXB', 'abu dhabi': 'AUH',
    'london': 'LHR',
    'paris': 'CDG',
    'amsterdam': 'AMS',
    'frankfurt': 'FRA',
    'delhi': 'DEL', 'new delhi': 'DEL',
    'mumbai': 'BOM',
    'new york': 'JFK',
    'los angeles': 'LAX',
    'chicago': 'ORD',
    'toronto': 'YYZ',
    'sydney': 'SYD',
    'singapore': 'SIN',
    'bangkok': 'BKK',
    'istanbul': 'IST',
};

// Country → default airport
const COUNTRY_TO_IATA = {
    'Uganda': 'EBB', 'Kenya': 'NBO', 'Tanzania': 'DAR',
    'South Africa': 'JNB', 'Nigeria': 'LOS', 'Ghana': 'ACC',
    'Egypt': 'CAI', 'Ethiopia': 'ADD',
    'United Kingdom': 'LHR', 'France': 'CDG', 'Germany': 'FRA',
    'Netherlands': 'AMS', 'Italy': 'FCO', 'Spain': 'MAD',
    'United States': 'JFK', 'Canada': 'YYZ',
    'UAE': 'DXB', 'India': 'DEL', 'Singapore': 'SIN',
    'Australia': 'SYD', 'Japan': 'NRT', 'China': 'PEK',
    'Turkey': 'IST', 'Brazil': 'GRU',
};

// In-memory cache: { [key]: { data, expires } }
if (!global.__dealsCache) global.__dealsCache = {};

function getCached(key) {
    const entry = global.__dealsCache[key];
    if (entry && Date.now() < entry.expires) return entry.data;
    return null;
}
function setCache(key, data) {
    global.__dealsCache[key] = { data, expires: Date.now() + CACHE_TTL_MS };
}

// Get departure dates for next month
function getNextDates(offsetDays = 30) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
}

// Fetch one route deal from Duffel
async function fetchDeal(origin, dest, date) {
    if (!DUFFEL_API_KEY) return null;
    try {
        const body = {
            data: {
                slices: [{ origin, destination: dest, departure_date: date }],
                passengers: [{ type: 'adult' }],
                cabin_class: 'economy',
                max_connections: 1
            }
        };
        const resp = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DUFFEL_API_KEY}`,
                'Content-Type': 'application/json',
                'Duffel-Version': 'v2',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!resp.ok) return null;
        const json = await resp.json();
        const offers = (json.data && json.data.offers) || [];
        if (!offers.length) return null;
        // Sort by price, take the cheapest
        offers.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount));
        const best = offers[0];
        const slice = best.slices && best.slices[0];
        const seg = slice && slice.segments && slice.segments[0];
        return {
            price: parseFloat(best.total_amount),
            currency: best.total_currency || 'USD',
            airline: seg ? (seg.marketing_carrier && seg.marketing_carrier.name) || '' : '',
            airlineCode: seg ? (seg.marketing_carrier && seg.marketing_carrier.iata_code) || '' : '',
            duration: slice ? slice.duration : '',
            stops: slice ? (slice.segments.length - 1) : 0,
            departTime: seg ? (seg.departing_at || '').slice(11, 16) : '',
            arriveTime: seg ? (seg.arriving_at || '').slice(11, 16) : '',
            date: date,
            offerId: best.id
        };
    } catch (e) {
        return null;
    }
}

// Generate mock deal when Duffel is unavailable (fallback)
function mockDeal(origin, routeInfo, index) {
    const prices = [180, 240, 320, 440, 560, 290, 380, 195, 650, 275];
    const airlines = ['Emirates', 'Qatar Airways', 'Turkish Airlines', 'British Airways', 'Air France', 'Flydubai', 'Kenya Airways'];
    const price = prices[index % prices.length] + Math.floor(Math.random() * 40);
    const date = getNextDates(21 + index * 7);
    return {
        price,
        currency: 'USD',
        airline: airlines[index % airlines.length],
        airlineCode: '',
        duration: '',
        stops: index % 3 === 0 ? 0 : 1,
        departTime: '',
        arriveTime: '',
        date,
        offerId: null,
        isMock: true
    };
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Get client IP
    const ip =
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.socket?.remoteAddress ||
        '';

    // If override provided in query/body, use it
    const overrideIata = (req.query && req.query.origin) || (req.body && req.body.origin) || '';

    // Check cache first
    const cacheKey = `deals_${overrideIata || ip}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json({ ok: true, ...cached, cached: true });

    // Step 1: Geolocate IP
    let city = '', country = '', iata = overrideIata || '';
    if (!iata) {
        try {
            // Skip geolocation for local IPs
            const isLocal = ['::1', '127.0.0.1', 'localhost', ''].includes(ip) || ip.startsWith('192.168') || ip.startsWith('10.');
            if (!isLocal) {
                const geoResp = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,query`, { timeout: 3000 });
                if (geoResp.ok) {
                    const geo = await geoResp.json();
                    city = geo.city || '';
                    country = geo.country || '';
                    iata = CITY_TO_IATA[city.toLowerCase()] || COUNTRY_TO_IATA[country] || '';
                }
            }
        } catch (e) { /* geo failed */ }
        if (!iata) iata = 'EBB'; // fallback
    }

    // Step 2: Get routes for this origin
    const routes = ROUTES[iata] || ROUTES.DEFAULT;

    // Step 3: Fetch deals from Duffel (parallel, with timeout)
    const departureDate = getNextDates(30);
    const dealPromises = routes.slice(0, 6).map((r, i) =>
        Promise.race([
            fetchDeal(iata, r.to, departureDate).then(d => d ? { ...d, ...r, from: iata } : null),
            new Promise(resolve => setTimeout(() => resolve(null), 6000))
        ])
    );
    const rawDeals = await Promise.all(dealPromises);

    // Step 4: Fill in mocks where Duffel returned null
    const deals = rawDeals.map((d, i) => {
        const route = routes[i];
        if (d) return d;
        const mock = mockDeal(iata, route, i);
        return { ...mock, ...route, from: iata };
    }).filter(Boolean);

    // Enrich with image URL (Unsplash source)
    const enriched = deals.map(d => ({
        ...d,
        imageUrl: `https://source.unsplash.com/400x250/?${encodeURIComponent(d.image || d.city)},travel,city`,
        hot: d.price < 250,
        tripType: 'one-way'
    }));

    const result = {
        origin: iata,
        city: city || iata,
        country,
        deals: enriched
    };

    setCache(cacheKey, result);
    return res.json({ ok: true, ...result, cached: false });
};
