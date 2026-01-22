# 🛠️ How to Get Real Flight Data in BookingCart

## Current Issue
Your website is showing mock data because the Amadeus API credentials in your `.env` file are placeholder/demo credentials that don't work with the real API endpoints.

## Solution: Get Real Amadeus API Credentials

### Step 1: Sign Up for Amadeus Developer Account
1. Go to: https://developers.amadeus.com/
2. Click "Sign Up" and create a free developer account
3. Verify your email address

### Step 2: Create a New Application
1. After logging in, go to your "Workspace" or "Dashboard"
2. Click "Create New App" or "Add Application"
3. Fill in the application details:
   - **App Name**: "BookingCart" (or any name you prefer)
   - **Description**: "Flight booking application"
   - **Company**: (optional)
4. Select the APIs you need:
   - ✅ **Flight Offers Search** 
   - ✅ **Airport & City Search**
5. Accept the terms and conditions

### Step 3: Get Your Credentials
1. Once your app is created, you'll see:
   - **API Key** (also called Client ID)
   - **API Secret** (also called Client Secret)
2. Copy both values - you'll need them for the next step

### Step 4: Update Your .env File
Open the `.env` file in your BookingCart folder and replace the placeholder credentials:

```env
# REPLACE THESE WITH YOUR REAL CREDENTIALS
AMADEUS_API_KEY=your_real_api_key_here
AMADEUS_API_SECRET=your_real_api_secret_here

# Keep these as-is
AMADEUS_ENV=test
PORT=3000
```

### Step 5: Test Your New Credentials
Run the test script to verify everything works:

```bash
node test-api.js
```

You should see "ALL TESTS PASSED!" if your credentials are working.

### Step 6: Restart Your Server
```bash
# Stop the current server (Ctrl+C)
# Then restart it:
node server.js
```

### Step 7: Test Your Website
1. Open http://localhost:3000 in your browser
2. Try searching for flights (e.g., JFK to LAX)
3. You should now see real flight data instead of mock data!

## 🎯 What to Expect

### With Real Credentials:
- ✅ Real airport suggestions when typing
- ✅ Actual flight prices and schedules
- ✅ Real airline information
- ✅ Accurate flight durations and times

### Test Environment Limitations:
- The test environment is free but has limited data
- Some routes might not have flights available
- Prices are estimates (not live booking prices)
- Limited to certain regions and airlines

## 🔧 Troubleshooting

### If you still see mock data:
1. Check that your .env file has the correct credentials
2. Restart the server after updating .env
3. Run `node test-api.js` to verify credentials work

### If you get API errors:
1. Verify your credentials are copied correctly (no extra spaces)
2. Make sure you're using the test environment (AMADEUS_ENV=test)
3. Check that you selected the right APIs when creating your app

### Common Issues:
- **"Internal error"**: Means credentials are invalid/placeholder
- **"Invalid credentials"**: Check for typos in API key/secret
- **"Rate limit exceeded"**: Wait a few minutes and try again

## 🚀 Next Steps

Once you have real data working:
1. Try different routes and dates
2. Test the complete booking flow
3. Explore the filtering options
4. Consider upgrading to production for live data

## 📞 Need Help?

- **Amadeus API Docs**: https://developers.amadeus.com/self-service
- **Support Portal**: Available in your Amadeus developer dashboard
- **Community Forum**: https://community.amadeus.com/

---

**Note**: The test environment is completely free to use. You only need to pay if you want to use the production environment for commercial applications.
