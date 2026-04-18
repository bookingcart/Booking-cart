'use strict';

/**
 * Admin PIN must be set explicitly (no default). Production requires a non-trivial PIN.
 */
function requireAdminPin(pin) {
  const expected = process.env.ADMIN_PIN;
  if (!expected || String(expected).length < 4) {
    const msg =
      process.env.NODE_ENV === 'production'
        ? 'Admin access is not configured'
        : 'Set ADMIN_PIN in your environment (min 4 characters)';
    return { ok: false, status: 503, error: msg };
  }
  if (pin !== expected) {
    return { ok: false, status: 401, error: 'Invalid PIN' };
  }
  return { ok: true };
}

function requireMongoUri() {
  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    return { ok: false, status: 503, error: 'Database is not configured (MONGODB_URI)' };
  }
  return { ok: true };
}

module.exports = { requireAdminPin, requireMongoUri };
