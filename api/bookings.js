// api/bookings.js – Vercel Serverless Function for booking CRUD using MongoDB Atlas
//
// Env vars required (set in Vercel dashboard):
//   MONGODB_URI
//
// Endpoints (all via POST body "action"):
//   { action: "save",   booking: {...} }
//   { action: "list"  }                        // admin – all bookings
//   { action: "lookup", email: "..." }          // client – by email
//   { action: "status", id: "...", status: "..." } // admin – update status

const { MongoClient } = require('mongodb');

// Vercel serverless functions shouldn't create a new connection per invocation
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    const uri = process.env.MONGODB_URI;

    // Local fallback if no MONGODB_URI is provided
    if (!uri) {
        console.warn("MONGODB_URI is not defined. Falling back to in-memory local array.");
        if (!global.__bookings) global.__bookings = [];
        return { db: null, collection: null };
    }

    if (cachedDb) {
        return { db: cachedDb, collection: cachedDb.collection('bookings') };
    }

    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    await client.connect();
    const db = client.db('bookingcart'); // Replace 'bookingcart' with your preferred DB name if different

    cachedClient = client;
    cachedDb = db;
    return { db, collection: db.collection('bookings') };
}

module.exports = async (req, res) => {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });

    const { action, booking, email, id, status, pin } = req.body || {};

    try {
        const { collection } = await connectToDatabase();

        // ── Save a new booking ──
        if (action === "save") {
            if (!booking) return res.status(400).json({ ok: false, error: "Missing booking" });

            booking.createdAt = new Date().toISOString();
            booking.status = "new";

            if (collection) {
                // MongoDB: Upsert by ref or just insert
                await collection.updateOne(
                    { ref: booking.ref },
                    { $set: booking },
                    { upsert: true }
                );
            } else {
                // Local fallback
                global.__bookings.unshift(booking);
            }

            return res.json({ ok: true, id: booking.ref });
        }

        // ── List all bookings (admin) ──
        if (action === "list") {
            const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
            if (pin !== ADMIN_PIN) return res.status(401).json({ ok: false, error: "Invalid PIN" });

            let all = [];
            if (collection) {
                all = await collection.find({}).sort({ createdAt: -1 }).toArray();
            } else {
                all = global.__bookings;
            }

            return res.json({ ok: true, bookings: all });
        }

        // ── Lookup bookings by email (client) ──
        if (action === "lookup") {
            if (!email) return res.status(400).json({ ok: false, error: "Missing email" });

            let found = [];
            if (collection) {
                // Construct query to find by contact.email (case insensitive using regex)
                found = await collection.find({
                    "contact.email": { $regex: new RegExp("^" + email + "$", "i") }
                }).sort({ createdAt: -1 }).toArray();
            } else {
                found = global.__bookings.filter(b =>
                    (b.contact && b.contact.email || "").toLowerCase() === email.toLowerCase()
                );
            }

            return res.json({ ok: true, bookings: found });
        }

        // ── Update booking status (admin) ──
        if (action === "status") {
            const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
            if (pin !== ADMIN_PIN) return res.status(401).json({ ok: false, error: "Invalid PIN" });
            if (!id || !status) return res.status(400).json({ ok: false, error: "Missing id or status" });

            if (collection) {
                const result = await collection.findOneAndUpdate(
                    { ref: id },
                    { $set: { status: status } },
                    { returnDocument: 'after' }
                );
                if (!result.value && !result) return res.status(404).json({ ok: false, error: "Booking not found" });
                return res.json({ ok: true, booking: result.value || result });
            } else {
                const idx = global.__bookings.findIndex(b => b.ref === id);
                if (idx === -1) return res.status(404).json({ ok: false, error: "Booking not found" });
                global.__bookings[idx].status = status;
                return res.json({ ok: true, booking: global.__bookings[idx] });
            }
        }

        return res.status(400).json({ ok: false, error: "Unknown action" });

    } catch (err) {
        console.error("Bookings API error:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
};
