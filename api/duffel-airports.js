// Load environment variables
require('dotenv').config();

const fetch = require('node-fetch');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';

/**
 * Airport search for Duffel using live Places API
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
    const { keyword } = req.query;

    if (!keyword || keyword.length < 2) {
      return res.json({ ok: true, airports: [] });
    }

    if (!DUFFEL_API_KEY) {
      return res.status(500).json({ ok: false, error: "Duffel API key not configured" });
    }

    // Fetch from Duffel Places API
    const response = await fetch(`${DUFFEL_BASE_URL}/places/suggestions?query=${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error("Duffel places API error:", await response.text());
      return res.json({ ok: true, airports: [] });
    }

    const { data } = await response.json();

    // Process results to match our frontend format
    const airports = [];

    for (const place of data) {
      if (place.type === 'airport') {
        airports.push({
          city: place.city_name || place.name,
          name: place.name,
          code: place.iata_code,
          country: place.iata_country_code
        });
      } else if (place.type === 'city' && Array.isArray(place.airports)) {
        // If it's a city, add its airports
        for (const airport of place.airports) {
          airports.push({
            city: place.name || airport.city_name,
            name: airport.name,
            code: airport.iata_code,
            country: airport.iata_country_code || place.iata_country_code
          });
        }
      }
    }

    // Remove duplicates by code
    const uniqueAirports = Array.from(new Map(airports.map(a => [a.code, a])).values());

    return res.json({ ok: true, airports: uniqueAirports.slice(0, 8) });

  } catch (error) {
    console.error('Error searching Duffel airports:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};
