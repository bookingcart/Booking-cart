// Load environment variables
require('dotenv').config();

const fetch = require('node-fetch');

/**
 * Airport search for Duffel (limited implementation)
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
    const { keyword } = req.query;

    if (!keyword || keyword.length < 2) {
      return res.json({ ok: true, airports: [] });
    }

    console.log("Searching Duffel airports for:", keyword);

    // Expanded airport list for better coverage
    const airports = [
      // Major International Airports
      { city: "London", name: "Heathrow", code: "LHR", country: "United Kingdom" },
      { city: "London", name: "Gatwick", code: "LGW", country: "United Kingdom" },
      { city: "Paris", name: "Charles de Gaulle", code: "CDG", country: "France" },
      { city: "Amsterdam", name: "Schiphol", code: "AMS", country: "Netherlands" },
      { city: "Frankfurt", name: "Frankfurt", code: "FRA", country: "Germany" },
      { city: "Munich", name: "Munich", code: "MUC", country: "Germany" },
      { city: "Rome", name: "Fiumicino", code: "FCO", country: "Italy" },
      { city: "Madrid", name: "Barajas", code: "MAD", country: "Spain" },
      { city: "Barcelona", name: "El Prat", code: "BCN", country: "Spain" },
      { city: "Istanbul", name: "Istanbul", code: "IST", country: "Turkey" },
      { city: "Dubai", name: "Dubai", code: "DXB", country: "United Arab Emirates" },
      { city: "Doha", name: "Hamad", code: "DOH", country: "Qatar" },
      { city: "Cairo", name: "Cairo", code: "CAI", country: "Egypt" },
      { city: "Riyadh", name: "King Khalid", code: "RUH", country: "Saudi Arabia" },
      { city: "Jeddah", name: "King Abdulaziz", code: "JED", country: "Saudi Arabia" },
      { city: "Nairobi", name: "Jomo Kenyatta International", code: "NBO", country: "Kenya" },
      { city: "Lagos", name: "Murtala Muhammed", code: "LOS", country: "Nigeria" },
      { city: "Johannesburg", name: "O.R. Tambo", code: "JNB", country: "South Africa" },
      // North America
      { city: "New York", name: "JFK", code: "JFK", country: "United States" },
      { city: "New York", name: "Newark", code: "EWR", country: "United States" },
      { city: "Boston", name: "Logan", code: "BOS", country: "United States" },
      { city: "Chicago", name: "O'Hare", code: "ORD", country: "United States" },
      { city: "Los Angeles", name: "LAX", code: "LAX", country: "United States" },
      { city: "San Francisco", name: "SFO", code: "SFO", country: "United States" },
      { city: "Toronto", name: "Pearson", code: "YYZ", country: "Canada" },
      { city: "Vancouver", name: "YVR", code: "YVR", country: "Canada" },
      { city: "Mexico City", name: "Benito Juárez", code: "MEX", country: "Mexico" },
      // South America
      { city: "São Paulo", name: "Guarulhos", code: "GRU", country: "Brazil" },
      { city: "Buenos Aires", name: "Ezeiza", code: "EZE", country: "Argentina" },
      // Asia Pacific
      { city: "Tokyo", name: "Haneda", code: "HND", country: "Japan" },
      { city: "Tokyo", name: "Narita", code: "NRT", country: "Japan" },
      { city: "Seoul", name: "Incheon", code: "ICN", country: "South Korea" },
      { city: "Singapore", name: "Changi", code: "SIN", country: "Singapore" },
      { city: "Hong Kong", name: "Hong Kong", code: "HKG", country: "Hong Kong" },
      { city: "Bangkok", name: "Suvarnabhumi", code: "BKK", country: "Thailand" },
      { city: "Delhi", name: "Indira Gandhi", code: "DEL", country: "India" },
      { city: "Mumbai", name: "Chhatrapati Shivaji", code: "BOM", country: "India" },
      { city: "Sydney", name: "Kingsford Smith", code: "SYD", country: "Australia" },
      { city: "Melbourne", name: "Tullamarine", code: "MEL", country: "Australia" },
      // Additional Major Hubs
      { city: "Atlanta", name: "Hartsfield-Jackson", code: "ATL", country: "United States" },
      { city: "Miami", name: "International", code: "MIA", country: "United States" },
      { city: "Dallas", name: "Fort Worth", code: "DFW", country: "United States" },
      { city: "Denver", name: "International", code: "DEN", country: "United States" },
      { city: "Seattle", name: "Tacoma International", code: "SEA", country: "United States" },
      { city: "Las Vegas", name: "McCarran", code: "LAS", country: "United States" },
      { city: "Orlando", name: "International", code: "MCO", country: "United States" },
      { city: "Philadelphia", name: "International", code: "PHL", country: "United States" },
      { city: "Phoenix", name: "Sky Harbor", code: "PHX", country: "United States" },
      { city: "Houston", name: "George Bush Intercontinental", code: "IAH", country: "United States" },
      { city: "Detroit", name: "Metropolitan Wayne County", code: "DTW", country: "United States" },
      { city: "Minneapolis", name: "Saint Paul International", code: "MSP", country: "United States" }
    ];

    // Filter airports based on keyword
    const results = airports.filter((airport) => {
      const searchStr = `${airport.city} ${airport.name} ${airport.code}`.toLowerCase();
      return searchStr.includes(keyword.toLowerCase());
    });

    console.log(`Found ${results.length} airports for "${keyword}"`);

    return res.json({
      ok: true,
      airports: results.slice(0, 10) // Limit to 10 results
    });

  } catch (error) {
    console.error("Duffel airport search error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to search airports"
    });
  }
};
