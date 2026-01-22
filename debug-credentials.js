#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;

console.log('🔍 Debugging Amadeus Credentials');
console.log('==================================');
console.log(`API Key: ${AMADEUS_API_KEY}`);
console.log(`API Secret: ${AMADEUS_API_SECRET}`);
console.log('');

// Test different API endpoints to see what works
async function testEndpoints() {
  try {
    // Get token first
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
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
      console.log('❌ Token failed:', await tokenResponse.text());
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token obtained successfully');
    console.log('');

    // Test 1: Airport search with different parameters
    console.log('🧪 Test 1: Airport Search (simple)');
    const test1 = await fetch('https://test.api.amadeus.com/v1/reference-data/locations?keyword=LON&subType=AIRPORT', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'  // Try without Amadeus-specific accept header
      }
    });
    console.log(`Status: ${test1.status}`);
    if (!test1.ok) {
      console.log('Error:', await test1.text());
    } else {
      console.log('✅ Success!');
    }
    console.log('');

    // Test 2: Try different endpoint
    console.log('🧪 Test 2: Airport Direct Search');
    const test2 = await fetch('https://test.api.amadeus.com/v1/reference-data/locations/AIRPORT', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });
    console.log(`Status: ${test2.status}`);
    if (!test2.ok) {
      console.log('Error:', await test2.text());
    } else {
      console.log('✅ Success!');
    }
    console.log('');

    // Test 3: Check what APIs are available
    console.log('🧪 Test 3: API Health Check');
    const test3 = await fetch('https://test.api.amadeus.com/v1/health', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });
    console.log(`Status: ${test3.status}`);
    if (!test3.ok) {
      console.log('Error:', await test3.text());
    } else {
      console.log('✅ Success!');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testEndpoints();
