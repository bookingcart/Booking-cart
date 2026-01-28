# 🎫 Ticketmaster API Setup Guide

## ✅ Your Credentials Are Configured!

You've added:
- **Consumer Key** → Use as `TICKETMASTER_API_KEY` or `TICKETMASTER_CONSUMER_KEY`
- **Consumer Secret** → Use as `TICKETMASTER_CONSUMER_SECRET`

---

## 📝 Update Your `.env` File

Make sure your `.env` file has these lines:

```env
TICKETMASTER_API_KEY=your_consumer_key_here
TICKETMASTER_CONSUMER_SECRET=your_consumer_secret_here
```

**OR** you can use:

```env
TICKETMASTER_CONSUMER_KEY=your_consumer_key_here
TICKETMASTER_CONSUMER_SECRET=your_consumer_secret_here
```

Both formats work - the code will use whichever is available.

---

## 🔍 Important Note About Ticketmaster APIs

**Ticketmaster Discovery API** (for public event search):
- ✅ Uses **simple API key** (your Consumer Key works as the API key)
- ✅ No OAuth required
- ✅ Perfect for searching public events

**Ticketmaster Commerce API** (for purchasing tickets):
- Uses OAuth 1.0 with Consumer Key/Secret
- Requires additional setup
- Not needed for event search

**For your use case (searching events):**
- Your **Consumer Key** = API Key ✅
- Your **Consumer Secret** = Not needed for Discovery API (but stored for future use)

---

## 🚀 Restart Your Server

After updating `.env`:

```bash
# Stop current server (Ctrl+C)
# Restart
node server.js
```

You should see:
```
✅ Ticketmaster API ready - Public events available!
   Using Consumer Key/Secret authentication
```

---

## 🧪 Test It

### Test Ticketmaster API:
```bash
curl "http://localhost:3000/api/events/ticketmaster?location=New%20York"
```

### Test Combined Search (Eventbrite + Ticketmaster):
```bash
curl "http://localhost:3000/api/events/search-combined?location=London"
```

### Test in Browser:
1. Go to: `http://localhost:3000/events.html`
2. Search for: "New York", "London", "Dubai", etc.
3. You should see live events from Ticketmaster!

---

## 📊 What You'll Get

**Ticketmaster Discovery API provides:**
- ✅ Millions of live events worldwide
- ✅ Concerts, sports, theater, comedy
- ✅ Event details, images, pricing
- ✅ Venue information
- ✅ Real-time availability

**Free Tier:**
- 5,000 requests/day
- Perfect for development and production

---

## 🎯 Next Steps

1. ✅ **Update `.env`** with your Consumer Key and Secret
2. ✅ **Restart server**
3. ✅ **Test the API** endpoints
4. ✅ **Search events** in your browser

---

## ❓ Troubleshooting

**If you get "API not configured" error:**
- Check `.env` file has `TICKETMASTER_API_KEY` or `TICKETMASTER_CONSUMER_KEY`
- Restart server after updating `.env`

**If you get "Invalid API key" error:**
- Verify your Consumer Key is correct
- Make sure there are no extra spaces in `.env` file

**If no events returned:**
- Try different cities (New York, London, Los Angeles)
- Check Ticketmaster API status
- Verify your API key has access to Discovery API

---

**Your Ticketmaster integration is ready! Just restart the server and start searching for live events!** 🎉
