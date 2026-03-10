// api/user.js – Vercel Serverless Function to persist Account Settings in MongoDB Atlas

const { MongoClient } = require('mongodb');

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
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    await client.connect();
    const db = client.db('bookingcart');
    cachedClient = client;
    cachedDb = db;
    return { collection: db.collection('users') };
}

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { collection } = await connectToDatabase();

        // ── GET: Load User Profile or Count ──
        if (req.method === "GET") {
            const action = req.query.action;

            // Admin: user count
            if (action === 'count') {
                const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
                if (req.query.pin !== ADMIN_PIN) return res.status(401).json({ ok: false, error: "Invalid PIN" });

                let count = 0;
                if (collection) {
                    count = await collection.countDocuments({});
                } else {
                    count = Object.keys(global.__users).length;
                }
                return res.json({ ok: true, count });
            }

            const email = req.query.email;
            if (!email) return res.status(400).json({ ok: false, error: "Missing email" });

            if (collection) {
                const user = await collection.findOne({ "profile.email": { $regex: new RegExp("^" + email + "$", "i") } });
                return res.json({ ok: true, state: user ? user.state : null });
            } else {
                return res.json({ ok: true, state: global.__users[email] || null });
            }
        }

        // ── POST: Save User Profile ──
        if (req.method === "POST") {
            const { email, state } = req.body || {};
            if (!email || !state) return res.status(400).json({ ok: false, error: "Missing email or state payload" });

            // Inject the email securely at the root for easy lookup, plus the full account-settings 'state' object
            const doc = {
                profile: { email: email.toLowerCase() },
                state: state,
                updatedAt: new Date().toISOString()
            };

            if (collection) {
                await collection.updateOne(
                    { "profile.email": { $regex: new RegExp("^" + email + "$", "i") } },
                    { $set: doc },
                    { upsert: true }
                );
            } else {
                global.__users[email] = state;
            }
            return res.json({ ok: true });
        }

        // ── DELETE: Delete User Profile ──
        if (req.method === "DELETE") {
            const email = req.body?.email || req.query?.email;
            if (!email) return res.status(400).json({ ok: false, error: "Missing email" });

            if (collection) {
                await collection.deleteOne({ "profile.email": { $regex: new RegExp("^" + email + "$", "i") } });
            } else {
                delete global.__users[email];
            }
            return res.json({ ok: true });
        }

        return res.status(405).json({ ok: false, error: "Method not allowed" });

    } catch (err) {
        console.error("User Settings API error:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
};
