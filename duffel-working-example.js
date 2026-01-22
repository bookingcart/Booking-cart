// Create a working Duffel example with available airports
require('dotenv').config();
const fetch = require('node-fetch');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY;
const DUFFEL_BASE_URL = 'https://api.duffel.com';

async function createWorkingExample() {
  console.log('Creating working Duffel example...');
  
  try {
    // First, get available airports
    const airportsResponse = await fetch(`${DUFFEL_BASE_URL}/air/airports?limit=100`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      }
    });

    if (!airportsResponse.ok) {
      console.log('Error getting airports:', airportsResponse.status);
      return;
    }

    const airportsData = await airportsResponse.json();
    const airports = airportsData.data || [];
    
    console.log(`Found ${airports.length} total airports`);
    
    // Find airports that are likely to have flights
    const majorAirports = airports.filter(a => {
      // Look for airports with typical major airport characteristics
      return a.iata_code && 
             a.iata_code.length === 3 &&
             a.name && 
             !a.name.toLowerCase().includes('airfield') &&
             !a.name.toLowerCase().includes('heliport') &&
             a.city_name;
    });

    console.log(`Found ${majorAirports.length} potential major airports`);
    
    // Take first few for testing
    const testAirports = majorAirports.slice(0, 10);
    console.log('Test airports:');
    testAirports.forEach(a => {
      console.log(`  ${a.iata_code}: ${a.name} (${a.city_name})`);
    });

    // Try to create a flight search between two different airports
    if (testAirports.length >= 2) {
      const origin = testAirports[0];
      const destination = testAirports[1];
      
      console.log(`\n--- Testing ${origin.iata_code} → ${destination.iata_code} ---`);
      
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
        
        // Try different date
        console.log('\n--- Trying different date ---');
        requestData.data.slices[0].departure_date = "2024-11-15";
        
        const response2 = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Duffel-Version': 'v2',
            'Authorization': `Bearer ${DUFFEL_API_KEY}`
          },
          body: JSON.stringify(requestData)
        });
        
        console.log('Second attempt status:', response2.status);
        
        if (!response2.ok) {
          const errorText2 = await response2.text();
          console.log('Second attempt error:', errorText2);
        } else {
          const data = await response2.json();
          console.log('✅ Success! Offer request ID:', data.data?.id);
        }
        
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
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

createWorkingExample();
