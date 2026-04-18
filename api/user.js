// api/user.js – Account settings persistence backed by MongoDB

const { getAdminPin, getCollections } = require('../lib/mongo');

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { users: collection } = await getCollections();

        // ── GET: Load User Profile or Count ──
        if (req.method === "GET") {
            const action = req.query.action;

            // Admin: user count
            if (action === 'count') {
                const ADMIN_PIN = getAdminPin();
                if (req.query.pin !== ADMIN_PIN) return res.status(401).json({ ok: false, error: "Invalid PIN" });

                const count = await collection.countDocuments({});
                return res.json({ ok: true, count });
            }

            const email = req.query.email;
            if (!email) return res.status(400).json({ ok: false, error: "Missing email" });

            const normalizedEmail = String(email).trim().toLowerCase();
            const user = await collection.findOne({ "profile.email": normalizedEmail });
            return res.json({ ok: true, state: user ? user.state : null });
        }

        // ── POST: Save User Profile ──
        if (req.method === "POST") {
            const { email, state } = req.body || {};
            if (!email || !state) return res.status(400).json({ ok: false, error: "Missing email or state payload" });

            // Inject the email securely at the root for easy lookup, plus the full account-settings 'state' object
            const doc = {
                profile: { email: String(email).trim().toLowerCase() },
                state: state,
                updatedAt: new Date().toISOString()
            };

            await collection.updateOne(
                { "profile.email": doc.profile.email },
                { $set: doc, $setOnInsert: { createdAt: new Date().toISOString() } },
                { upsert: true }
            );
            return res.json({ ok: true });
        }

        // ── DELETE: Delete User Profile ──
        if (req.method === "DELETE") {
            const email = req.body?.email || req.query?.email;
            if (!email) return res.status(400).json({ ok: false, error: "Missing email" });

            await collection.deleteOne({ "profile.email": String(email).trim().toLowerCase() });
            return res.json({ ok: true });
        }

        return res.status(405).json({ ok: false, error: "Method not allowed" });

    } catch (err) {
        console.error("User Settings API error:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
};
