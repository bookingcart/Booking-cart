# 🛫 Duffel API Integration Guide

## Overview
Your BookingCart website now supports **dual API integration**:
- ✅ **Amadeus API** (existing)
- ✅ **Duffel API** (newly added)

## 🎯 Why Duffel API?
- **Modern REST API** with JSON responses
- **Comprehensive flight data** with detailed pricing
- **Real-time availability** and booking capabilities
- **Excellent documentation** and developer experience
- **Free tier available** for development

## 🚀 Quick Setup

### Step 1: Get Duffel API Key
1. **Go to**: https://app.duffel.com/join
2. **Sign up** for a free account
3. **Verify your email** immediately
4. **Go to Dashboard** → **API Keys**
5. **Copy your API key**

### Step 2: Configure Your Website
```bash
# Option 1: Use the update script
node update-credentials.js

# Option 2: Edit .env file directly
# Add this line to your .env file:
DUFFEL_API_KEY=your_actual_duffel_api_key_here
```

### Step 3: Restart Server
```bash
# Stop current server (Ctrl+C)
# Restart with new credentials
node server.js
```

## 🎯 Expected Output
When both APIs are configured, you'll see:
```
🎉 Both Amadeus and Duffel APIs are configured!
   Your website can now show real flight data from multiple sources.
```

## 🔄 How It Works

### Smart API Fallback
1. **First**: Tries Amadeus API
2. **If no results**: Tries Duffel API  
3. **If still no results**: Shows mock data
4. **Airport search**: Tries both APIs, then local data

### Flight Search Flow
```
User Search → Amadeus API → Duffel API → Mock Data
```

### Airport Search Flow  
```
User Types → Amadeus → Duffel → Local Airports
```

## 🧪 Test Both APIs

### Test Amadeus
```bash
curl -X POST http://localhost:3000/api/amadeus-search \
  -H "Content-Type: application/json" \
  -d '{"originLocationCode":"JFK","destinationLocationCode":"LAX","departureDate":"2024-12-15","adults":1}'
```

### Test Duffel
```bash
curl -X POST http://localhost:3000/api/duffel-search \
  -H "Content-Type: application/json" \
  -d '{"originLocationCode":"JFK","destinationLocationCode":"LAX","departureDate":"2024-12-15","adults":1}'
```

## 📊 API Comparison

| Feature | Amadeus | Duffel |
|---------|----------|---------|
| **Setup** | Complex | Simple |
| **Documentation** | Good | Excellent |
| **Free Tier** | Limited | Available |
| **Data Quality** | Excellent | Excellent |
| **Response Format** | Complex | Clean JSON |
| **Airport Search** | ✅ | Limited |
| **Flight Search** | ✅ | ✅ |
| **Real-time Pricing** | ✅ | ✅ |

## 🔧 Configuration Options

### Environment Variables
```bash
# Amadeus API
AMADEUS_API_KEY=your_amadeus_key
AMADEUS_API_SECRET=your_amadeus_secret
AMADEUS_ENV=test  # or 'production'

# Duffel API  
DUFFEL_API_KEY=your_duffel_key

# Server
PORT=3000
```

### API Priority
You can modify the search priority in `js/bookingcart.js`:
```javascript
// Change order to try Duffel first
flights = await fetchDuffelFlights(state, search);
if (!flights || flights.length === 0) {
  flights = await fetchAmadeusFlights(state, search);
}
```

## 🎨 Frontend Integration

### API Source Indicators
Your website automatically shows which API provided the data:
- **"Found X flights via Amadeus"**
- **"Found X flights via Duffel"**

### Error Handling
- **Graceful fallback** between APIs
- **Clear error messages** for users
- **Automatic mock data** when APIs fail

## 🚨 Troubleshooting

### Duffel API Not Working?
1. **Check API key**: `node -e "console.log(process.env.DUFFEL_API_KEY)"`
2. **Verify key format**: Should start with `duffel_test_` or `duffel_live_`
3. **Check server logs**: Look for Duffel-specific errors
4. **Test connection**: Use the curl commands above

### Both APIs Failing?
1. **Check internet connection**
2. **Verify API keys** in `.env` file
3. **Check server logs** for specific errors
4. **Try mock data**: Website should still work

### Airport Search Issues?
- **Duffel**: Limited to common airports
- **Amadeus**: Full airport database
- **Fallback**: Local airport list always works

## 🎯 Benefits of Dual API

### Reliability
- **Redundancy**: If one API fails, the other works
- **Uptime**: Higher availability for real data
- **Flexibility**: Choose best API for each route

### Data Comparison
- **Price comparison** between sources
- **Route coverage** from multiple airlines
- **Availability** across different systems

### Future-Proofing
- **Easy to add more APIs**
- **Scalable architecture**
- **Vendor independence**

## 📞 Support

### Duffel Support
- **Documentation**: https://duffel.com/docs
- **Help Center**: https://help.duffel.com
- **API Status**: https://www.duffelstatus.com

### Amadeus Support  
- **Documentation**: https://developers.amadeus.com
- **Help Center**: Available in developer dashboard

---

## 🎉 You're All Set!

Your BookingCart website now has:
- ✅ **Dual API integration** for maximum reliability
- ✅ **Smart fallback** system
- ✅ **Real-time flight data** from multiple sources
- ✅ **Comprehensive error handling**
- ✅ **Easy configuration** management

**Next Steps:**
1. Get your Duffel API key
2. Configure it in your `.env` file
3. Restart the server
4. Test with real flight searches

**Your website is now enterprise-ready with multiple flight data sources!** 🛫
