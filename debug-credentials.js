#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;

function mask(v) {
  if (!v) return '(not set)';
  if (v.length <= 6) return '***';
  return v.slice(0, 4) + '…' + v.slice(-2);
}

console.log('Debugging Amadeus credentials (redacted)');
console.log('==========================================');
console.log(`API Key: ${mask(AMADEUS_API_KEY)}`);
console.log(`API Secret: ${mask(AMADEUS_API_SECRET)}`);
console.log('');

async function testEndpoints() {
  try {
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET
      })
    });

    if (!tokenResponse.ok) {
      console.log('Token failed:', tokenResponse.status, await tokenResponse.text());
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('Token obtained successfully (expires in', tokenData.expires_in, 's)');
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testEndpoints();
