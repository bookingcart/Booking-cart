// api/user.js – persist Account Settings (Nile Database / Postgres or local fallback)

const { getPool } = require('../lib/db');
const { getCorsHeaders } = require('../lib/cors');
const { verifyRequestBearer } = require('../lib/google-verify');
const { requireAdminPin } = require('../lib/admin');

function applyCors(req, res) {
  const h = getCorsHeaders(req);
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v));
}

module.exports = async (req, res) => {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await getPool();

    if (!db && process.env.NODE_ENV !== 'production') {
      if (!global.__users) global.__users = {};
    }

    if (req.method === 'GET') {
      const action = req.query.action;

      if (action === 'count') {
        const gate = requireAdminPin(req.query.pin);
        if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error });

        let count = 0;
        if (db) {
          const result = await db.query('SELECT COUNT(*) FROM users');
          count = parseInt(result.rows[0].count, 10);
        } else {
          count = Object.keys(global.__users || {}).length;
        }
        return res.json({ ok: true, count });
      }

      const email = String(req.query.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json({ ok: false, error: 'Missing email' });

      if (process.env.NODE_ENV === 'production' && !db) {
        return res.status(503).json({ ok: false, error: 'Database is not configured (DATABASE_URL)' });
      }

      const auth = await verifyRequestBearer(req);
      if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });
      if (auth.email !== email) {
        return res.status(403).json({ ok: false, error: 'Email does not match signed-in account' });
      }

      if (db) {
        const result = await db.query('SELECT state FROM users WHERE email ILIKE $1', [email]);
        return res.json({ ok: true, state: result.rows.length > 0 ? result.rows[0].state : null });
      }
      return res.json({ ok: true, state: global.__users[email] || null });
    }

    if (req.method === 'POST') {
      if (process.env.NODE_ENV === 'production' && !db) {
        return res.status(503).json({ ok: false, error: 'Database is not configured (DATABASE_URL)' });
      }

      const auth = await verifyRequestBearer(req);
      if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });

      const body = req.body || {};
      const emailRaw = String(body.email || '').trim().toLowerCase();
      if (!emailRaw || !body.state) {
        return res.status(400).json({ ok: false, error: 'Missing email or state payload' });
      }
      if (auth.email !== emailRaw) {
        return res.status(403).json({ ok: false, error: 'Email does not match signed-in account' });
      }

      if (db) {
        await db.query(`
          INSERT INTO users (email, state, updated_at) 
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (email) DO UPDATE 
          SET state = EXCLUDED.state, updated_at = CURRENT_TIMESTAMP
        `, [emailRaw, JSON.stringify(body.state)]);
      } else {
        global.__users[emailRaw] = body.state;
      }
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (process.env.NODE_ENV === 'production' && !db) {
        return res.status(503).json({ ok: false, error: 'Database is not configured (DATABASE_URL)' });
      }

      const auth = await verifyRequestBearer(req);
      if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });

      const email = String(req.body?.email || req.query?.email || '')
        .trim()
        .toLowerCase();
      if (!email) return res.status(400).json({ ok: false, error: 'Missing email' });
      if (auth.email !== email) {
        return res.status(403).json({ ok: false, error: 'Email does not match signed-in account' });
      }

      if (db) {
        await db.query('DELETE FROM users WHERE email ILIKE $1', [email]);
      } else {
        delete global.__users[email];
      }
      return res.json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('User Settings API error:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
};
