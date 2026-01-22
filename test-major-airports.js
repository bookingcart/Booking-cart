// Search for major airports in Duffel
require('dotenv').config();
const fetch = require('node-fetch');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY;
const DUFFEL_BASE_URL = 'https://api.duffel.com';

async function searchMajorAirports() {
  console.log('Searching for major airports...');
  
  const majorCities = ['London', 'New York', 'Los Angeles', 'Paris', 'Tokyo', 'Dubai', 'Singapore', 'Hong Kong'];
  
  for (const city of majorCities) {
    try {
      console.log(`\n--- Searching for ${city} ---`);
      const response = await fetch(`${DUFFEL_BASE_URL}/air/airports?search=${city}&limit=20`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Duffel-Version': 'v2',
          'Authorization': `Bearer ${DUFFEL_API_KEY}`
        }
      });

      if (!response.ok) {
        console.log(`Error searching ${city}:`, response.status);
        continue;
      }

      const data = await response.json();
      const airports = data.data || [];
      
      console.log(`Found ${airports.length} airports for ${city}`);
      
      // Find major airports
      const majorAirports = airports.filter(a => {
        const code = a.iata_code;
        return code && code.length === 3 && a.name && !a.name.toLowerCase().includes('airfield');
      });
      
      if (majorAirports.length > 0) {
        console.log('Major airports found:');
        majorAirports.slice(0, 3).forEach(a => {
          console.log(`  ${a.iata_code}: ${a.name} (${a.city_name})`);
        });
        
        // Store for testing
        if (city === 'London' && majorAirports[0]) {
          global.lhrAirport = majorAirports[0];
        }
        if (city === 'New York' && majorAirports[0]) {
          global.jfkAirport = majorAirports[0];
        }
      }
    } catch (error) {
      console.error(`Error searching ${city}:`, error.message);
    }
  }
  
  // Test flight search if we found major airports
  if (global.lhrAirport && global.jfkAirport) {
    console.log('\n--- Testing LHR to JFK ---');
    await testFlightSearch(global.lhrAirport, global.jfkAirport);
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
              time_zone: origin.time_zone,
              latitude: origin.latitude,
              longitude: origin.longitude
            },
            destination_type: "airport",
            destination: {
              type: "airport",
              id: destination.id,
              iata_code: destination.iata_code,
              iata_country_code: destination.iata_country_code,
              name: destination.name,
              city_name: destination.city_name,
              time_zone: destination.time_zone,
              latitude: destination.latitude,
              longitude: destination.longitude
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
    
    // Get offers
    if (data.data?.id) {
      const offersResponse = await fetch(
        `${DUFFEL_BASE_URL}/air/offers?offer_request_id=${data.data.id}&limit=3`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Duffel-Version': 'v2',
            'Authorization': `Bearer ${DUFFEL_API_KEY}`
          }
        }
      );
      
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        console.log(`Found ${offersData.data?.length || 0} flight offers!`);
        
        if (offersData.data?.length > 0) {
          const offer = offersData.data[0];
          console.log('Sample flight:');
          console.log(`  Airline: ${offer.slices?.[0]?.segments?.[0]?.marketing_carrier?.name || 'Unknown'}`);
          console.log(`  Price: ${offer.total_amount} ${offer.total_currency}`);
          console.log(`  Duration: ${offer.slices?.[0]?.duration || 'Unknown'}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Flight search failed:', error.message);
  }
}

searchMajorAirports();
