// Load environment variables
require('dotenv').config();

const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN || '';
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || process.env.TICKETMASTER_CONSUMER_KEY || '';

/**
 * Check events API configuration status
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
    const eventbriteConfigured = !!EVENTBRITE_TOKEN;
    const ticketmasterConfigured = !!TICKETMASTER_API_KEY;

    if (!eventbriteConfigured && !ticketmasterConfigured) {
      return res.status(503).json({
        ok: false,
        error: "No events API configured",
        eventbriteConfigured,
        ticketmasterConfigured
      });
    }

    return res.json({ 
      ok: true, 
      eventbriteConfigured, 
      ticketmasterConfigured 
    });

  } catch (error) {
    console.error('Events status check error:', error);
    return res.status(500).json({
      ok: false,
      error: "Failed to check events status"
    });
  }
};
