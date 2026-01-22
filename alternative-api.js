// Alternative Flight API Integration (Aviationstack)
// This can be used as backup if Amadeus doesn't work

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();

// Aviationstack API (free tier: 500 requests/month)
const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY || '';

// Alternative flight search endpoint
app.post('/api/aviationstack-search', async (req, res) => {
  try {
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults = 1,
      children = 0,
      infants = 0
    } = req.body;

    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required parameters'
      });
    }

    if (!AVIATIONSTACK_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'Aviationstack API key not configured'
      });
    }

    // Aviationstack API call
    const params = new URLSearchParams({
      access_key: AVIATIONSTACK_API_KEY,
      dep_iata: originLocationCode,
      arr_iata: destinationLocationCode,
      date: departureDate
    });

    const response = await fetch(
      `http://api.aviationstack.com/v1/flights?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Aviationstack API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to match our frontend format
    const flights = (data.data || []).map((flight, index) => ({
      id: `AV-${index}-${Date.now()}`,
      airline: {
        code: flight.airline?.iata || 'AV',
        name: flight.airline?.name || 'Unknown Airline',
        logo: flight.airline?.iata?.substring(0, 2) || 'AV'
      },
      departTime: flight.departure?.scheduled?.substring(11, 16) || '00:00',
      arriveTime: flight.arrival?.scheduled?.substring(11, 16) || '00:00',
      durationMin: flight.flight?.duration || 120,
      stops: 0, // Aviationstack free tier doesn't provide stops info
      price: flight.price ? Math.round(flight.price * 1.2) : 299 // Add markup
    }));

    res.json({
      ok: true,
      flights,
      meta: {
        count: flights.length,
        total: flights.length,
        source: 'aviationstack'
      }
    });

  } catch (error) {
    console.error('Aviationstack search error:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Airport search for Aviationstack (limited)
app.get('/api/aviationstack-airports', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.length < 2) {
      return res.json({ ok: true, airports: [] });
    }

    // Aviationstack doesn't have airport search, so return common airports
    const commonAirports = [
      { city: "New York", name: "John F. Kennedy International", code: "JFK", country: "United States" },
      { city: "Los Angeles", name: "Los Angeles International", code: "LAX", country: "United States" },
      { city: "London", name: "Heathrow", code: "LHR", country: "United Kingdom" },
      { city: "Paris", name: "Charles de Gaulle", code: "CDG", country: "France" },
      { city: "Tokyo", name: "Haneda", code: "HND", country: "Japan" },
      { city: "Dubai", name: "Dubai International", code: "DXB", country: "UAE" }
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
    console.error('Airport search error:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

console.log('📋 Alternative API server ready');
console.log('Add AVIATIONSTACK_API_KEY to your .env file to use this backup');
console.log('Get free API key at: https://aviationstack.com/');

module.exports = app;
