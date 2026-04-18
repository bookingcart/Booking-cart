'use strict';

const { OAuth2Client } = require('google-auth-library');

let client = null;

function getClient() {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) return null;
  if (!client) client = new OAuth2Client(id);
  return client;
}

/**
 * @param {string} bearerHeader - value of Authorization header
 * @returns {Promise<{ ok: true, email: string, payload: object } | { ok: false, status: number, error: string }>}
 */
async function verifyAuthorizationBearer(bearerHeader) {
  if (!bearerHeader || !String(bearerHeader).startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing or invalid Authorization' };
  }
  const idToken = String(bearerHeader).slice('Bearer '.length).trim();
  if (!idToken) {
    return { ok: false, status: 401, error: 'Missing ID token' };
  }

  const oauth = getClient();
  if (!oauth) {
    return { ok: false, status: 503, error: 'Google Sign-In is not configured (GOOGLE_CLIENT_ID)' };
  }

  try {
    const ticket = await oauth.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = (payload.email || '').trim().toLowerCase();
    if (!email || payload.email_verified === false) {
      return { ok: false, status: 403, error: 'Invalid or unverified Google account' };
    }
    return { ok: true, email, payload };
  } catch (e) {
    console.error('Google ID token verification failed:', e.message);
    return { ok: false, status: 401, error: 'Invalid Google ID token' };
  }
}

/**
 * Express / Netlify-style req with headers object.
 */
async function verifyRequestBearer(req) {
  const raw =
    (req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  return verifyAuthorizationBearer(raw);
}

module.exports = {
  verifyAuthorizationBearer,
  verifyRequestBearer
};
