// api/user.js – persist Account Settings (MongoDB Atlas or local fallback)

const { MongoClient } = require('mongodb');
const { getCorsHeaders } = require('../lib/cors');
const { verifyRequestBearer } = require('../lib/google-verify');
const { requireAdminPin } = require('../lib/admin');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    if (!global.__users) global.__users = {};
    return { collection: null };
  }

  if (cachedDb) {
    return { collection: cachedDb.collection('users') };
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 2000,
    connectTimeoutMS: 2000
  });

  try {
    await client.connect();
    const db = client.db('bookingcart');
    cachedClient = client;
    cachedDb = db;
    return { collection: db.collection('users') };
  } catch (err) {
    console.warn('MongoDB users connection failed, using fallback store:', err.message);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    if (!global.__users) global.__users = {};
    return { collection: null };
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

  try {
    const { collection } = await connectToDatabase();

    if (req.method === 'GET') {
      const action = req.query.action;

      if (action === 'count') {
        const gate = requireAdminPin(req.query.pin);
        if (!gate.ok) return res.status(gate.status).json({ ok: false, error: gate.error });

        let count = 0;
        if (collection) {
          count = await collection.countDocuments({});
        } else {
          count = Object.keys(global.__users || {}).length;
        }
        return res.json({ ok: true, count });
      }

      const email = String(req.query.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json({ ok: false, error: 'Missing email' });

      if (process.env.NODE_ENV === 'production' && !collection) {
        return res.status(503).json({ ok: false, error: 'Database is not configured (MONGODB_URI)' });
      }

      const auth = await verifyRequestBearer(req);
      if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });
      if (auth.email !== email) {
        return res.status(403).json({ ok: false, error: 'Email does not match signed-in account' });
      }

      if (collection) {
        const user = await collection.findOne({
          'profile.email': { $regex: new RegExp('^' + escapeRegex(email) + '$', 'i') }
        });
        return res.json({ ok: true, state: user ? user.state : null });
      }
      return res.json({ ok: true, state: global.__users[email] || null });
    }

    if (req.method === 'POST') {
      if (process.env.NODE_ENV === 'production' && !collection) {
        return res.status(503).json({ ok: false, error: 'Database is not configured (MONGODB_URI)' });
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

      const doc = {
        profile: { email: emailRaw },
        state: body.state,
        updatedAt: new Date().toISOString()
      };

      if (collection) {
        await collection.updateOne(
          { 'profile.email': { $regex: new RegExp('^' + escapeRegex(emailRaw) + '$', 'i') } },
          { $set: doc },
          { upsert: true }
        );
      } else {
        global.__users[emailRaw] = body.state;
      }
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (process.env.NODE_ENV === 'production' && !collection) {
        return res.status(503).json({ ok: false, error: 'Database is not configured (MONGODB_URI)' });
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

      if (collection) {
        await collection.deleteOne({
          'profile.email': { $regex: new RegExp('^' + escapeRegex(email) + '$', 'i') }
        });
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

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
