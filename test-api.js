#!/usr/bin/env node

// Test script to verify Amadeus API connection
require('dotenv').config();

const fetch = require('node-fetch');

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY || '';
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET || '';
const AMADEUS_ENV = process.env.AMADEUS_ENV || 'test';

const AMADEUS_BASE_URL = AMADEUS_ENV === 'production' 
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com';

async function testAmadeusAPI() {
  console.log('🧪 Testing Amadeus API Connection');
  console.log('==================================');
  console.log(`Environment: ${AMADEUS_ENV}`);
  console.log(`API Key: ${AMADEUS_API_KEY ? `${AMADEUS_API_KEY.substring(0, 8)}...` : 'NOT SET'}`);
  console.log(`API Secret: ${AMADEUS_API_SECRET ? `${AMADEUS_API_SECRET.substring(0, 4)}...` : 'NOT SET'}`);
  console.log('');

  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.log('❌ FAIL: API credentials not configured');
    return false;
  }

  try {
    // Test 1: Get OAuth Token
    console.log('🔑 Testing OAuth Token...');
    const tokenResponse = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.log(`❌ FAIL: Token request failed (${tokenResponse.status})`);
      console.log(`Error: ${error}`);
      return false;
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ SUCCESS: OAuth token obtained');
    console.log(`Token expires in: ${tokenData.expires_in} seconds`);

    // Test 2: Airport Search
    console.log('');
    console.log(' airport Testing Airport Search...');
    const airportResponse = await fetch(
      `${AMADEUS_BASE_URL}/v1/reference-data/locations?keyword=New York&subType=AIRPORT,CITY&page[limit]=5`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.amadeus+json'
        }
      }
    );

    if (!airportResponse.ok) {
      const error = await airportResponse.json();
      console.log(`❌ FAIL: Airport search failed (${airportResponse.status})`);
      console.log(`Error: ${JSON.stringify(error.errors || error)}`);
      return false;
    }

    const airportData = await airportResponse.json();
    console.log(`✅ SUCCESS: Found ${airportData.data?.length || 0} airports`);
    airportData.data?.slice(0, 3).forEach((airport, i) => {
      console.log(`   ${i + 1}. ${airport.name} (${airport.iataCode}) - ${airport.address?.cityName || 'N/A'}`);
    });

    // Test 3: Flight Search (limited test)
    console.log('');
    console.log('✈️  Testing Flight Search...');
    const flightResponse = await fetch(
      `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?originLocationCode=JFK&destinationLocationCode=LAX&departureDate=2024-12-15&adults=1&max=5`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.amadeus+json'
        }
      }
    );

    if (!flightResponse.ok) {
      const error = await flightResponse.json();
      console.log(`❌ FAIL: Flight search failed (${flightResponse.status})`);
      console.log(`Error: ${JSON.stringify(error.errors || error)}`);
      return false;
    }

    const flightData = await flightResponse.json();
    console.log(`✅ SUCCESS: Found ${flightData.data?.length || 0} flight offers`);
    
    if (flightData.data?.length > 0) {
      const firstFlight = flightData.data[0];
      console.log(`   Sample flight: ${firstFlight.validatingAirlineCodes?.[0]} from ${firstFlight.itineraries[0].segments[0].departure.iataCode} to ${firstFlight.itineraries[0].segments[0].arrival.iataCode}`);
      console.log(`   Price: ${firstFlight.price?.total} ${firstFlight.price?.currencyCode}`);
    }

    console.log('');
    console.log('🎉 ALL TESTS PASSED! Your Amadeus API is working correctly.');
    console.log('');
    console.log('Your website should now show real flight data instead of mock data.');
    console.log('Restart your server with: node server.js');
    
    return true;

  } catch (error) {
    console.log('❌ FAIL: Unexpected error');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

testAmadeusAPI();
