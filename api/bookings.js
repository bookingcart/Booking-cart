// api/bookings.js – booking CRUD backed by MongoDB

const { getAdminPin, getCollections, writeAudit } = require('../lib/mongo');

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        const { bookings: collection, audit } = await getCollections();

        // ── Save a new booking ──
        if (action === "save") {
            if (!booking) return res.status(400).json({ ok: false, error: "Missing booking" });

            if (!booking.ref) return res.status(400).json({ ok: false, error: "Missing booking.ref" });

            const now = new Date().toISOString();
            await collection.updateOne(
                { ref: booking.ref },
                {
                    $setOnInsert: {
                        status: booking.status || "new",
                        createdAt: booking.createdAt || now
                    },
                    $set: {
                        ref: booking.ref,
                        route: booking.route,
                        dates: booking.dates,
                        flight: booking.flight,
                        passengers: booking.passengers,
                        contact: booking.contact,
                        extras: booking.extras,
                        total: booking.total,
                        updatedAt: now
                    }
                },
                { upsert: true }
            );

            return res.json({ ok: true, id: booking.ref });
        }

        // ── List all bookings (admin) ──
        if (action === "list") {
            const ADMIN_PIN = getAdminPin();
            if (pin !== ADMIN_PIN) return res.status(401).json({ ok: false, error: "Invalid PIN" });

            const all = await collection.find({}).sort({ createdAt: -1 }).toArray();

            return res.json({ ok: true, bookings: all });
        }

        // ── Lookup bookings by email (client) ──
        if (action === "lookup") {
            if (!email) return res.status(400).json({ ok: false, error: "Missing email" });

            const found = await collection.find({
                "contact.email": { $regex: new RegExp("^" + escapeRegExp(email) + "$", "i") }
            }).sort({ createdAt: -1 }).toArray();

            return res.json({ ok: true, bookings: found });
        }

        // ── Update booking status (admin) ──
        if (action === "status") {
            const ADMIN_PIN = getAdminPin();
            if (pin !== ADMIN_PIN) return res.status(401).json({ ok: false, error: "Invalid PIN" });
            if (!id || !status) return res.status(400).json({ ok: false, error: "Missing id or status" });

            const result = await collection.findOneAndUpdate(
                { ref: id },
                { $set: { status: status, updatedAt: new Date().toISOString() } },
                { returnDocument: 'after' }
            );
            const bookingDoc = result.value || result;
            if (!bookingDoc) return res.status(404).json({ ok: false, error: "Booking not found" });

            await writeAudit(audit, {
                type: "booking.status",
                bookingRef: id,
                status
            });

            return res.json({ ok: true, booking: bookingDoc });
        }

        // ── Delete booking ──
        if (action === "delete") {
            if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

            await collection.deleteOne({ ref: id });
            await writeAudit(audit, {
                type: "booking.delete",
                bookingRef: id
            });

            return res.json({ ok: true });
        }

        // ── Upload ticket (Admin) ──
        if (action === "upload_ticket") {
            const ADMIN_PIN = getAdminPin();
            if (pin !== ADMIN_PIN) return res.status(401).json({ ok: false, error: "Invalid PIN" });
            const { ticket } = req.body;
            if (!id || !ticket) return res.status(400).json({ ok: false, error: "Missing id or ticket data" });

            const result = await collection.findOneAndUpdate(
                { ref: id },
                { $set: { status: "issued", ticket: ticket, updatedAt: new Date().toISOString() } },
                { returnDocument: 'after' }
            );
            const bookingDoc = result.value || result;
            if (!bookingDoc) return res.status(404).json({ ok: false, error: "Booking not found" });

            await writeAudit(audit, {
                type: "booking.ticket.upload",
                bookingRef: id
            });

            return res.json({ ok: true, booking: bookingDoc });
        }

        // ── Track ticket download (Client) ──
        if (action === "track_download") {
            if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

            await collection.updateOne(
                { ref: id },
                { $inc: { downloadCount: 1 }, $set: { updatedAt: new Date().toISOString() } }
            );
            return res.json({ ok: true });
        }

        return res.status(400).json({ ok: false, error: "Unknown action" });

    } catch (err) {
        console.error("Bookings API error:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
};
