# BookingCart - Flight Booking Application

A modern flight booking application with Amadeus Flight Offers Search API integration.

## Features

- ✈️ **Flight Search**: Search for flights using Amadeus Flight Offers Search API
- 🎯 **Smart Airport Search**: Uses Amadeus Airport & City Search API for accurate airport suggestions
- 🔍 **Advanced Filtering**: Filter by price, stops, airline, and departure time
- 📱 **Responsive Design**: Modern, clean UI that works on all devices
- 💳 **Complete Booking Flow**: Search → Results → Details → Passengers → Extras → Payment → Confirmation

## Prerequisites

- Node.js 14+ and npm
- Amadeus Self-Service API account ([Sign up here](https://developers.amadeus.com/))

## Setup Instructions

### 1. Get Amadeus API Credentials

1. Go to [Amadeus Self-Service Portal](https://developers.amadeus.com/)
2. Sign up for a free developer account
3. Create a new app in your workspace
4. Copy your **API Key** (Client ID) and **API Secret** (Client Secret)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Amadeus credentials:

```env
AMADEUS_API_KEY=your_api_key_here
AMADEUS_API_SECRET=your_api_secret_here
AMADEUS_ENV=test
PORT=3000
```

**Note**: 
- Use `AMADEUS_ENV=test` for sandbox/testing (free, limited data)
- Use `AMADEUS_ENV=production` for live data (requires commercial agreement)

### 4. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
BookingCart/
├── server.js              # Express backend server with Amadeus API integration
├── package.json           # Node.js dependencies
├── .env.example          # Environment variables template
├── index.html            # Flight search page
├── results.html          # Flight results page
├── details.html          # Flight details page
├── passengers.html        # Passenger information page
├── extras.html           # Extras selection page
├── payment.html          # Payment page
├── confirmation.html    # Booking confirmation page
├── css/
│   └── bookingcart.css   # Styles
└── js/
    └── bookingcart.js    # Frontend JavaScript
```

## API Endpoints

### POST `/api/amadeus-search`

Search for flights using Amadeus Flight Offers Search API.

**Request Body:**
```json
{
  "originLocationCode": "JFK",
  "destinationLocationCode": "LAX",
  "departureDate": "2024-06-15",
  "returnDate": "2024-06-22",
  "adults": 1,
  "children": 0,
  "infants": 0,
  "travelClass": "ECONOMY",
  "currencyCode": "USD",
  "max": 30
}
```

**Response:**
```json
{
  "ok": true,
  "flights": [
    {
      "id": "AA-0-1234567890",
      "airline": {
        "code": "AA",
        "name": "American Airlines",
        "logo": "AA"
      },
      "departTime": "08:30",
      "arriveTime": "11:45",
      "durationMin": 195,
      "stops": 0,
      "price": 299
    }
  ],
  "meta": {
    "count": 1,
    "total": 1
  }
}
```

### GET `/api/amadeus-airports?keyword=New York`

Search for airports and cities using Amadeus Airport & City Search API.

**Response:**
```json
{
  "ok": true,
  "airports": [
    {
      "city": "New York",
      "name": "John F. Kennedy International Airport",
      "code": "JFK",
      "country": "United States"
    }
  ]
}
```

## Amadeus API Integration

This application integrates with the following Amadeus Self-Service APIs:

1. **Flight Offers Search** - Search for flight offers
2. **Airport & City Search** - Search for airports and cities

### Authentication

The backend automatically handles OAuth 2.0 authentication with Amadeus:
- Obtains access token using client credentials flow
- Caches tokens to minimize API calls
- Refreshes tokens automatically when expired

### Rate Limits

- **Test Environment**: Free tier with limited quota
- **Production**: Subject to your Amadeus agreement

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server on file changes.

### Testing Without Amadeus API

If Amadeus credentials are not configured, the application will:
- Show a warning in the console
- Fall back to mock/demo flight data
- Still function for UI/UX testing

## Troubleshooting

### "Website shows mock data instead of real flights"

This happens when your Amadeus API credentials are not configured or are using placeholder/demo credentials.

**Quick Fix:**
1. Get real API credentials from https://developers.amadeus.com/
2. Run: `node update-credentials.js` and enter your credentials
3. Test with: `node test-api.js`
4. Restart server: `node server.js`

**Detailed Guide:** See `FIX-REAL-DATA.md` for complete instructions.

### "Amadeus API credentials not configured"

Make sure you've:
1. Created a `.env` file from `.env.example`
2. Added your `AMADEUS_API_KEY` and `AMADEUS_API_SECRET`
3. Restarted the server after adding credentials

### "Amadeus search failed" or API errors

- Verify your API credentials are correct
- Check that you're using the correct environment (`test` vs `production`)
- Ensure your Amadeus account has available quota
- Check the server console for detailed error messages
- Run `node test-api.js` to diagnose connection issues

### Airport search not working

- The app falls back to local airport data if Amadeus API is unavailable
- Check browser console for API errors
- Verify the backend server is running
- Test credentials with `node test-api.js`

## Production Deployment

For production deployment:

1. Set `AMADEUS_ENV=production` in your environment variables
2. Ensure you have a production Amadeus API account
3. Use a process manager like PM2 or deploy to a platform like Heroku, Railway, or Render
4. Set up proper environment variable management
5. Consider adding rate limiting and caching for better performance

## License

MIT

## Resources

- [Amadeus Self-Service API Documentation](https://developers.amadeus.com/self-service)
- [Flight Offers Search API](https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search)
- [Airport & City Search API](https://developers.amadeus.com/self-service/category/airport/api-doc/airport-and-city-search)
# Bookingcart
