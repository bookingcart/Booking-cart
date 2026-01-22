// Test Duffel airport suggestions to understand the format
require('dotenv').config();
const fetch = require('node-fetch');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY;
const DUFFEL_BASE_URL = 'https://api.duffel.com';

async function testDuffelAirports() {
  console.log('Testing Duffel airport suggestions...');
  
  try {
    // Test airport suggestions
    const response = await fetch(`${DUFFEL_BASE_URL}/air/airports?limit=10`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      }
    });

    console.log('Airport suggestions status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Found airports:', data.data?.length || 0);
    
    if (data.data?.length > 0) {
      console.log('First airport example:');
      console.log(JSON.stringify(data.data[0], null, 2));
      
      // Find JFK and LAX specifically
      const jfk = data.data.find(a => a.iata_code === 'JFK');
      const lax = data.data.find(a => a.iata_code === 'LAX');
      const lhr = data.data.find(a => a.iata_code === 'LHR');
      const cdg = data.data.find(a => a.iata_code === 'CDG');
      
      console.log('\nAvailable airports:');
      console.log('JFK:', jfk ? '✅' : '❌');
      console.log('LAX:', lax ? '✅' : '❌');
      console.log('LHR:', lhr ? '✅' : '❌');
      console.log('CDG:', cdg ? '✅' : '❌');
      
      if (jfk && lax) {
        console.log('\n--- Testing JFK to LAX ---');
        await testFlightSearch(jfk, lax);
      } else if (lhr && cdg) {
        console.log('\n--- Testing LHR to CDG ---');
        await testFlightSearch(lhr, cdg);
      } else {
        console.log('\n--- Testing first available pair ---');
        await testFlightSearch(data.data[0], data.data[1]);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

async function testFlightSearch(origin, destination) {
  try {
    const requestData = {
      data: {
        slices: [
          {
            origin_type: "airport",
            origin: {
              type: "airport",
              id: origin.id,
              iata_code: origin.iata_code,
              iata_country_code: origin.iata_country_code,
              name: origin.name,
              city_name: origin.city_name,
              city: origin.city,
              airports: origin.airports
            },
            destination_type: "airport",
            destination: {
              type: "airport",
              id: destination.id,
              iata_code: destination.iata_code,
              iata_country_code: destination.iata_country_code,
              name: destination.name,
              city_name: destination.city_name,
              city: destination.city,
              airports: destination.airports
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

    console.log('Testing flight:', origin.iata_code, '→', destination.iata_code);

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

    console.log('Flight search status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Flight search error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! Offer request ID:', data.data?.id);
    
  } catch (error) {
    console.error('Flight search failed:', error.message);
  }
}

testDuffelAirports();
