#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Update Amadeus API Credentials');
console.log('==================================');
console.log('');

function updateCredentials(apiKey, apiSecret) {
  const envPath = path.join(__dirname, '.env');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update API key
    envContent = envContent.replace(/AMADEUS_API_KEY=.*/, `AMADEUS_API_KEY=${apiKey}`);
    
    // Update API secret
    envContent = envContent.replace(/AMADEUS_API_SECRET=.*/, `AMADEUS_API_SECRET=${apiSecret}`);
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Credentials updated successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: node test-api.js (to verify credentials)');
    console.log('2. Run: node server.js (to restart server)');
    console.log('3. Visit: http://localhost:3000 (to test with real data)');
    
  } catch (error) {
    console.log('❌ Error updating .env file:', error.message);
  }
  
  rl.close();
}

console.log('Please enter your Amadeus API credentials:');
console.log('(Get these from: https://developers.amadeus.com/)');
console.log('');

rl.question('API Key (Client ID): ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ API Key is required');
    rl.close();
    return;
  }
  
  rl.question('API Secret (Client Secret): ', (apiSecret) => {
    if (!apiSecret || apiSecret.trim() === '') {
      console.log('❌ API Secret is required');
      rl.close();
      return;
    }
    
    updateCredentials(apiKey.trim(), apiSecret.trim());
  });
});
