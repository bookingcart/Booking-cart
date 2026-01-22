// Test Duffel API directly to debug the issue
require('dotenv').config();
const fetch = require('node-fetch');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY;
const DUFFEL_BASE_URL = 'https://api.duffel.com';

async function testDuffelAPI() {
  console.log('Testing Duffel API...');
  console.log('API Key:', DUFFEL_API_KEY ? 'configured' : 'not configured');
  
  // Test 1: Simple offer request with minimal data
  console.log('\n--- Test 1: Minimal offer request ---');
  try {
    const requestData = {
      data: {
        slices: [
          {
            origin_type: "airport",
            origin: {
              type: "airport",
              iata_code: "LHR"
            },
            destination_type: "airport", 
            destination: {
              type: "airport",
              iata_code: "CDG"
            },
            departure_date: "2024-12-15"
          }
        ],
        passengers: [
          {
            type: "adult",
            count: 1
          }
        ]
      }
    };

    console.log('Request data:', JSON.stringify(requestData, null, 2));

    const response = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Offer request ID:', data.data?.id);
    
    // Test 2: Get offers for this request
    if (data.data?.id) {
      console.log('\n--- Test 2: Get offers ---');
      const offersResponse = await fetch(
        `${DUFFEL_BASE_URL}/air/offers?offer_request_id=${data.data.id}&limit=5`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Duffel-Version': 'v2',
            'Authorization': `Bearer ${DUFFEL_API_KEY}`
          }
        }
      );
      
      console.log('Offers response status:', offersResponse.status);
      
      if (!offersResponse.ok) {
        const errorText = await offersResponse.text();
        console.log('Offers error:', errorText);
        return;
      }
      
      const offersData = await offersResponse.json();
      console.log('Found offers:', offersData.data?.length || 0);
      
      if (offersData.data?.length > 0) {
        console.log('First offer:', JSON.stringify(offersData.data[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDuffelAPI();
