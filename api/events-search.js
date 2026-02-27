// Load environment variables
require('dotenv').config();

const fetch = require('node-fetch');

const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN || '';
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || process.env.TICKETMASTER_CONSUMER_KEY || '';
const EVENTBRITE_BASE_URL = 'https://www.eventbriteapi.com/v3';
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

/**
 * Combined events search from Eventbrite and Ticketmaster
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const location = String(req.query.location || '').trim();

    if (!location) {
      return res.status(400).json({
        ok: false,
        error: "Location parameter is required"
      });
    }

    console.log(`Searching events for location: ${location}`);

    const results = [];

    // Search Eventbrite
    if (EVENTBRITE_TOKEN) {
      try {
        const eventbriteResponse = await fetch(
          `${EVENTBRITE_BASE_URL}/events/search/?location.address=${encodeURIComponent(location)}&expand=venue&sort_by=date`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${EVENTBRITE_TOKEN}`,
            },
          }
        );

        if (eventbriteResponse.ok) {
          const eventbriteData = await eventbriteResponse.json();
          const eventbriteEvents = (eventbriteData.events || []).map(event => ({
            id: event.id,
            name: event.name?.text || 'Unknown Event',
            date: event.start?.local ? new Date(event.start.local).toLocaleDateString() : 'TBD',
            time: event.start?.local ? new Date(event.start.local).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
            venue: event.venue?.name || 'TBD',
            url: event.url || '#',
            source: 'Eventbrite',
            image: event.logo?.url || null
          }));
          results.push(...eventbriteEvents);
          console.log(`Found ${eventbriteEvents.length} Eventbrite events`);
        }
      } catch (e) {
        console.warn('Eventbrite search failed:', e);
      }
    }

    // Search Ticketmaster
    if (TICKETMASTER_API_KEY) {
      try {
        const ticketmasterResponse = await fetch(
          `${TICKETMASTER_BASE_URL}/events.json?apikey=${TICKETMASTER_API_KEY}&city=${encodeURIComponent(location)}&size=20`,
          {
            method: 'GET',
          }
        );

        if (ticketmasterResponse.ok) {
          const ticketmasterData = await ticketmasterResponse.json();
          const ticketmasterEvents = (ticketmasterData._embedded?.events || []).map(event => ({
            id: event.id,
            name: event.name || 'Unknown Event',
            date: event.dates?.start?.localDate ? new Date(event.dates.start.localDate).toLocaleDateString() : 'TBD',
            time: event.dates?.start?.localTime || 'TBD',
            venue: event._embedded?.venues?.[0]?.name || 'TBD',
            url: event.url || '#',
            source: 'Ticketmaster',
            image: event.images?.[0]?.url || null
          }));
          results.push(...ticketmasterEvents);
          console.log(`Found ${ticketmasterEvents.length} Ticketmaster events`);
        }
      } catch (e) {
        console.warn('Ticketmaster search failed:', e);
      }
    }

    // Remove duplicates based on name and date
    const uniqueEvents = results.filter((event, index, self) =>
      index === self.findIndex((e) => e.name === event.name && e.date === event.date)
    );

    // Sort by date
    uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`Total unique events found: ${uniqueEvents.length}`);

    return res.json({
      ok: true,
      events: uniqueEvents.slice(0, 20), // Limit to 20 results
      total: uniqueEvents.length
    });

  } catch (error) {
    console.error('Events search error:', error);
    return res.status(500).json({
      ok: false,
      error: "Failed to search events"
    });
  }
};
