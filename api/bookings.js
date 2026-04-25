// api/bookings.js – booking CRUD (Nile Database / Postgres or in-memory fallback outside production)

const { getPool } = require('../lib/db');
const { getCorsHeaders } = require('../lib/cors');
const { verifyRequestBearer } = require('../lib/google-verify');
const { requireAdminPin } = require('../lib/admin');
const fs = require('fs');
const path = require('path');

const LOCAL_BOOKINGS_FILE = path.join(process.cwd(), 'local-bookings.json');

function loadLocalBookings() {
  if (process.env.NODE_ENV === 'production') return [];
  try {
    if (fs.existsSync(LOCAL_BOOKINGS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_BOOKINGS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load local bookings:', err);
  }
  return [];
}

function saveLocalBookings(bookings) {
  if (process.env.NODE_ENV === 'production') return;
  try {
    fs.writeFileSync(LOCAL_BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
  } catch (err) {
    console.error('Failed to save local bookings:', err);
  }
}

function applyCors(req, res) {
  const h = getCorsHeaders(req);
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v));
}

module.exports = async (req, res) => {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const { action, booking, email, id, status, pin } = req.body || {};

  try {
    const db = await getPool();

    if (!db && process.env.NODE_ENV !== 'production') {
      if (!global.__bookings) global.__bookings = loadLocalBookings();
    }

    if (process.env.NODE_ENV === 'production' && !db) {
      return res.status(503).json({ ok: false, error: 'Database is not configured (NILE_DB_URL or DATABASE_URL)' });
    }

    if (action === 'save') {
      if (!booking) return res.status(400).json({ ok: false, error: 'Missing booking' });

      if (db) {
        booking.createdAt = booking.createdAt || new Date().toISOString();
        booking.status = booking.status || 'new';
        const contactEmail = ((booking.contact && booking.contact.email) || '').trim().toLowerCase();

        await db.query(`
          INSERT INTO bookings (ref, email, data) 
          VALUES ($1, $2, $3)
          ON CONFLICT (ref) DO UPDATE 
          SET email = EXCLUDED.email, data = EXCLUDED.data
        `, [booking.ref, contactEmail, JSON.stringify(booking)]);
      } else {
        const exists = global.__bookings.find((b) => b.ref === booking.ref);
        if (!exists) {
          booking.createdAt = new Date().toISOString();
          booking.status = 'new';
          global.__bookings.unshift(booking);
          saveLocalBookings(global.__bookings);
        }
      }

      return res.json({ ok: true, id: booking.ref });
    }

    if (action === 'list') {
      const gate = requireAdminPin(pin);
      if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error });

      let all = [];
      if (db) {
        const result = await db.query('SELECT data FROM bookings ORDER BY created_at DESC');
        all = result.rows.map(r => r.data);
      } else {
        all = global.__bookings;
      }

      return res.json({ ok: true, bookings: all });
    }

    if (action === 'lookup') {
      if (!email) return res.status(400).json({ ok: false, error: 'Missing email' });

      const auth = await verifyRequestBearer(req);
      if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });
      if (auth.email !== String(email).trim().toLowerCase()) {
        return res.status(403).json({ ok: false, error: 'Email does not match signed-in account' });
      }

      let found = [];
      if (db) {
        const result = await db.query(
          'SELECT data FROM bookings WHERE email ILIKE $1 ORDER BY created_at DESC', 
          [String(email).trim()]
        );
        found = result.rows.map(r => r.data);
      } else {
        found = global.__bookings.filter(
          (b) => ((b.contact && b.contact.email) || '').toLowerCase() === email.toLowerCase()
        );
      }

      return res.json({ ok: true, bookings: found });
    }

    if (action === 'status') {
      const gate = requireAdminPin(pin);
      if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error });
      if (!id || !status) return res.status(400).json({ ok: false, error: 'Missing id or status' });

      if (db) {
        const getRes = await db.query('SELECT data FROM bookings WHERE ref = $1', [id]);
        if (getRes.rows.length === 0) return res.status(404).json({ ok: false, error: 'Booking not found' });
        
        const b = getRes.rows[0].data;
        b.status = status;
        
        await db.query('UPDATE bookings SET data = $1 WHERE ref = $2', [JSON.stringify(b), id]);
        return res.json({ ok: true, booking: b });
      }

      const idx = global.__bookings.findIndex((b) => b.ref === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: 'Booking not found' });
      global.__bookings[idx].status = status;
      saveLocalBookings(global.__bookings);
      return res.json({ ok: true, booking: global.__bookings[idx] });
    }

    if (action === 'cancel_own') {
      if (!id) return res.status(400).json({ ok: false, error: 'Missing id' });
      const auth = await verifyRequestBearer(req);
      if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });

      if (db) {
        const getRes = await db.query('SELECT data, email FROM bookings WHERE ref = $1', [id]);
        if (getRes.rows.length === 0) return res.status(404).json({ ok: false, error: 'Booking not found' });
        
        const row = getRes.rows[0];
        const em = (row.email || '').trim().toLowerCase();
        
        if (!em || em !== auth.email) {
          return res.status(403).json({ ok: false, error: 'Not allowed for this booking' });
        }
        
        const b = row.data;
        b.status = 'cancelled';
        await db.query('UPDATE bookings SET data = $1 WHERE ref = $2', [JSON.stringify(b), id]);
      } else {
        const idx = global.__bookings.findIndex((x) => x.ref === id);
        if (idx === -1) return res.status(404).json({ ok: false, error: 'Booking not found' });
        const em = ((global.__bookings[idx].contact && global.__bookings[idx].contact.email) || '')
          .trim()
          .toLowerCase();
        if (!em || em !== auth.email) {
          return res.status(403).json({ ok: false, error: 'Not allowed for this booking' });
        }
        global.__bookings[idx].status = 'cancelled';
        saveLocalBookings(global.__bookings);
      }
      return res.json({ ok: true });
    }

    if (action === 'delete') {
      const gate = requireAdminPin(pin);
      if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error });
      if (!id) return res.status(400).json({ ok: false, error: 'Missing id' });

      if (db) {
        await db.query('DELETE FROM bookings WHERE ref = $1', [id]);
      } else {
        global.__bookings = global.__bookings.filter((b) => b.ref !== id);
        saveLocalBookings(global.__bookings);
      }
      return res.json({ ok: true });
    }

    if (action === 'upload_ticket') {
      const gate = requireAdminPin(pin);
      if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error });
      const { ticket } = req.body;
      if (!id || !ticket) return res.status(400).json({ ok: false, error: 'Missing id or ticket data' });

      if (db) {
        const getRes = await db.query('SELECT data FROM bookings WHERE ref = $1', [id]);
        if (getRes.rows.length === 0) return res.status(404).json({ ok: false, error: 'Booking not found' });
        
        const b = getRes.rows[0].data;
        b.status = 'issued';
        b.ticket = ticket;
        
        await db.query('UPDATE bookings SET data = $1 WHERE ref = $2', [JSON.stringify(b), id]);
        return res.json({ ok: true, booking: b });
      }

      const idx = global.__bookings.findIndex((b) => b.ref === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: 'Booking not found' });
      global.__bookings[idx].status = 'issued';
      global.__bookings[idx].ticket = ticket;
      saveLocalBookings(global.__bookings);
      return res.json({ ok: true, booking: global.__bookings[idx] });
    }

    if (action === 'track_download') {
      if (!id) return res.status(400).json({ ok: false, error: 'Missing id' });

      if (db) {
        const getRes = await db.query('SELECT data FROM bookings WHERE ref = $1', [id]);
        if (getRes.rows.length > 0) {
          const b = getRes.rows[0].data;
          b.downloadCount = (b.downloadCount || 0) + 1;
          await db.query('UPDATE bookings SET data = $1 WHERE ref = $2', [JSON.stringify(b), id]);
        }
      } else {
        const idx = global.__bookings.findIndex((b) => b.ref === id);
        if (idx !== -1) {
          global.__bookings[idx].downloadCount = (global.__bookings[idx].downloadCount || 0) + 1;
          saveLocalBookings(global.__bookings);
        }
      }
      return res.json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    console.error('Bookings API error:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
};
