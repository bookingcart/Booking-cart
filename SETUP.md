# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Amadeus API Credentials

1. Visit https://developers.amadeus.com/
2. Sign up for a free developer account
3. Create a new app in your workspace
4. Copy your **API Key** (Client ID) and **API Secret** (Client Secret)

## Step 3: Create Environment File

Create a file named `.env` in the project root with the following content:

```env
AMADEUS_API_KEY=your_api_key_here
AMADEUS_API_SECRET=your_api_secret_here
AMADEUS_ENV=test
PORT=3000
```

Replace `your_api_key_here` and `your_api_secret_here` with your actual Amadeus credentials.

**Note**: 
- Use `AMADEUS_ENV=test` for sandbox/testing (free, limited data)
- Use `AMADEUS_ENV=production` for live data (requires commercial agreement)

## Step 4: Start the Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Testing Without Amadeus API

If you don't have Amadeus credentials yet, the application will:
- Show a warning in the console
- Fall back to mock/demo flight data
- Still function for UI/UX testing

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, change the PORT in your `.env` file:

```env
PORT=3001
```

### Module Not Found Errors

Make sure you've run `npm install` to install all dependencies.

### Amadeus API Errors

- Verify your API credentials are correct
- Check that you're using the correct environment (`test` vs `production`)
- Ensure your Amadeus account has available quota
- Check the server console for detailed error messages
