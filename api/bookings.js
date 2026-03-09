// api/bookings.js – Vercel Serverless Function for booking CRUD
//
// Env vars required (set in Vercel dashboard after adding a KV store):
//   KV_REST_API_URL, KV_REST_API_TOKEN
//
// Endpoints (all via POST body "action"):
//   { action: "save",   booking: {...} }
//   { action: "list"  }                        // admin – all bookings
//   { action: "lookup", email: "..." }          // client – by email
//   { action: "status", id: "...", status: "..." } // admin – update status

const BOOKINGS_KEY = "bookings";   // Redis key: JSON array

module.exports = async (req, res) => {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });

    // Try Vercel KV first, fall back to in-memory for local dev
    let kv;
    try {
        kv = require("@vercel/kv").kv;
    } catch (e) {
        // Fallback – will not persist but lets local dev work
        kv = null;
    }

    const { action, booking, email, id, status, pin } = req.body || {};

    try {
        // ── Helpers ──
        async function getAll() {
            if (kv && process.env.KV_REST_API_URL) {
                const data = await kv.get(BOOKINGS_KEY);
                return Array.isArray(data) ? data : [];
            }
            // local fallback: read from global
            if (!global.__bookings) global.__bookings = [];
            return global.__bookings;
        }

        async function saveAll(arr) {
            if (kv && process.env.KV_REST_API_URL) {
                await kv.set(BOOKINGS_KEY, arr);
            } else {
                global.__bookings = arr;
            }
        }

        // ── Save a new booking ──
        if (action === "save") {
            if (!booking) return res.status(400).json({ ok: false, error: "Missing booking" });
            const all = await getAll();
            booking.createdAt = new Date().toISOString();
            booking.status = "new";
            all.unshift(booking); // newest first
            await saveAll(all);
            return res.json({ ok: true, id: booking.ref });
        }

        // ── List all bookings (admin) ──
        if (action === "list") {
            const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
            if (pin !== ADMIN_PIN) return res.status(401).json({ ok: false, error: "Invalid PIN" });
            const all = await getAll();
            return res.json({ ok: true, bookings: all });
        }

        // ── Lookup bookings by email (client) ──
        if (action === "lookup") {
            if (!email) return res.status(400).json({ ok: false, error: "Missing email" });
            const all = await getAll();
            const found = all.filter(b =>
                (b.contact && b.contact.email || "").toLowerCase() === email.toLowerCase()
            );
            return res.json({ ok: true, bookings: found });
        }

        // ── Update booking status (admin) ──
        if (action === "status") {
            const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
            if (pin !== ADMIN_PIN) return res.status(401).json({ ok: false, error: "Invalid PIN" });
            if (!id || !status) return res.status(400).json({ ok: false, error: "Missing id or status" });
            const all = await getAll();
            const idx = all.findIndex(b => b.ref === id);
            if (idx === -1) return res.status(404).json({ ok: false, error: "Booking not found" });
            all[idx].status = status;
            await saveAll(all);
            return res.json({ ok: true, booking: all[idx] });
        }

        return res.status(400).json({ ok: false, error: "Unknown action" });

    } catch (err) {
        console.error("Bookings API error:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
};
