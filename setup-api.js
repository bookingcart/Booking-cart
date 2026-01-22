#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🛠️  BookingCart API Setup Guide');
console.log('================================');
console.log('');
console.log('Your website is currently showing mock data because the Amadeus API');
console.log('credentials in your .env file appear to be placeholder/demo credentials.');
console.log('');
console.log('To get REAL flight data, follow these steps:');
console.log('');
console.log('1. 📝 Get Amadeus API Credentials:');
console.log('   • Go to: https://developers.amadeus.com/');
console.log('   • Sign up for a free developer account');
console.log('   • Create a new app in your workspace');
console.log('   • Copy your API Key (Client ID) and API Secret (Client Secret)');
console.log('');
console.log('2. 🔧 Update your .env file:');
console.log('   • Replace the placeholder credentials with your real ones');
console.log('   • Keep AMADEUS_ENV=test for free testing');
console.log('');
console.log('3. 🚀 Restart the server:');
console.log('   • Stop the current server (Ctrl+C)');
console.log('   • Run: node server.js');
console.log('');
console.log('📊 Current .env file status:');
console.log('');

try {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('AMADEUS_API_KEY=')) {
      const key = line.split('=')[1];
      if (key.includes('your_') || key.includes('Exuu9GRr')) {
        console.log('❌ API Key: Needs to be replaced with real credentials');
      } else {
        console.log('✅ API Key: Appears to be configured');
      }
    }
    if (line.startsWith('AMADEUS_API_SECRET=')) {
      const secret = line.split('=')[1];
      if (secret.includes('your_') || secret.includes('dtrZYn62eBIJnpFZ')) {
        console.log('❌ API Secret: Needs to be replaced with real credentials');
      } else {
        console.log('✅ API Secret: Appears to be configured');
      }
    }
  });
} catch (error) {
  console.log('❌ Could not read .env file');
}

console.log('');
console.log('💡 Tips:');
console.log('• The test environment is free but has limited data');
console.log('• Real flight prices and schedules may vary');
console.log('• Some routes might not have available flights in test mode');
console.log('');
console.log('🔗 Useful Links:');
console.log('• Amadeus API Docs: https://developers.amadeus.com/self-service');
console.log('• Flight Search API: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search');
console.log('• Airport Search API: https://developers.amadeus.com/self-service/category/airport/api-doc/airport-and-city-search');
