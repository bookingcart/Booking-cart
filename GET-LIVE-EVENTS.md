# 🎫 How to Get Live Events - Quick Guide

## ✅ Solution: Add Ticketmaster API (Recommended)

I've added **Ticketmaster API integration** to your server! This gives you access to **millions of live public events** including:
- 🎵 Concerts
- ⚽ Sports events  
- 🎭 Theater & Arts
- 😂 Comedy shows
- 🎪 Festivals

---

## 🚀 Quick Setup (2 minutes)

### Step 1: Get Ticketmaster API Key

1. Go to: **https://developer.ticketmaster.com/**
2. Click **"Sign Up"** (free account)
3. Create a new app
4. Copy your **API Key**

### Step 2: Add to `.env` file

Add this line to your `.env` file:
```env
TICKETMASTER_API_KEY=your_api_key_here
```

### Step 3: Restart Server

```bash
# Stop current server (Ctrl+C)
# Restart
node server.js
```

You should see:
```
✅ Ticketmaster API ready - Public events available!
```

---

## 🎯 How It Works Now

### New Endpoints Added:

1. **`GET /api/events/ticketmaster?location=London`**
   - Searches Ticketmaster for public events
   - Returns concerts, sports, theater, comedy

2. **`GET /api/events/search-combined?location=London`**
   - Searches BOTH Eventbrite + Ticketmaster
   - Combines results from both sources
   - Best option for maximum coverage

### Updated Frontend:

Your `events.html` page now automatically:
1. ✅ Tries combined search first (Eventbrite + Ticketmaster)
2. ✅ Falls back to Eventbrite if combined fails
3. ✅ Falls back to Ticketmaster if Eventbrite has no results

---

## 🧪 Test It Now

### Without Ticketmaster API Key (Current):
```bash
# Test Eventbrite (your events)
curl "http://localhost:3000/api/events/search?location=London"

# Test demo endpoint
curl "http://localhost:3000/api/events/demo"
```

### With Ticketmaster API Key (After Setup):
```bash
# Test Ticketmaster (public events)
curl "http://localhost:3000/api/events/ticketmaster?location=New%20York"

# Test combined search (best results)
curl "http://localhost:3000/api/events/search-combined?location=London"
```

---

## 📊 What You'll Get

**Ticketmaster API provides:**
- ✅ **Millions of live events** worldwide
- ✅ Event details (name, description, date, venue)
- ✅ Event images/logos
- ✅ Pricing information
- ✅ Venue details (address, city, country)
- ✅ Real-time availability

**Free Tier Limits:**
- 5,000 requests/day
- Perfect for development and small production sites

---

## 🎨 Example Response

```json
{
  "ok": true,
  "events": [
    {
      "name": { "text": "Taylor Swift Concert" },
      "start": { "local": "2024-06-15T19:00:00" },
      "venue": {
        "name": "Madison Square Garden",
        "address": {
          "city": "New York",
          "region": "NY",
          "country": "United States"
        }
      },
      "price": 150,
      "currency": "USD",
      "logo": { "url": "https://..." },
      "_source": "ticketmaster"
    }
  ]
}
```

---

## 🔄 Current Status

**Eventbrite API:**
- ✅ Configured: `EVENTBRITE_TOKEN=NPYR2YLSJKCEBU6LUKVT`
- ✅ Working: Shows events from your organizations
- ⚠️ Limited: Only your own events

**Ticketmaster API:**
- ⏳ **Not configured yet** - Add `TICKETMASTER_API_KEY` to `.env`
- ✅ **Code ready** - Integration complete
- 🎯 **Will provide:** Public events once configured

---

## 💡 Pro Tips

1. **Use Combined Search**: `/api/events/search-combined` gives best results
2. **Location Format**: Use city names (e.g., "London", "New York", "Dubai")
3. **Rate Limits**: Ticketmaster allows 5,000 requests/day (free tier)
4. **Caching**: Consider caching results for 1-2 hours to reduce API calls

---

## 🎉 Next Steps

1. **Get Ticketmaster API key** (5 minutes)
2. **Add to `.env` file**
3. **Restart server**
4. **Test in browser**: Go to `http://localhost:3000/events.html`
5. **Search for events**: Try "London", "New York", "Dubai", etc.

---

**Once you add the Ticketmaster API key, you'll have access to millions of live events!** 🎊
