// lib/db.js - Centralized Nile/Postgres Connection & Table Initialization
"use strict";

const { Pool } = require("pg");

let pool = null;
let initPromise = null;

/**
 * Gets the database connection string from environment variables.
 */
function getDbUri() {
  return String(process.env.NILE_DB_URL || process.env.DATABASE_URL || "").trim();
}

/**
 * Checks if the database is configured.
 */
function isDbConfigured() {
  return !!getDbUri();
}

/**
 * Returns a Postgres Pool singleton.
 */
async function getPool() {
  const uri = getDbUri();
  if (!uri) return null;

  if (!pool) {
    pool = new Pool({
      connectionString: uri,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

/**
 * Ensures all required tables exist in the Nile database.
 */
async function ensureTables(db) {
  if (!db) return;

  try {
    // 1. Search Cache Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS search_cache (
        key VARCHAR(255) PRIMARY KEY,
        payload JSONB,
        meta JSONB,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Admin Audit Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_audit (
        id SERIAL PRIMARY KEY,
        event JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Bookings Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        ref VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        data JSONB NOT NULL
      )
    `);

    // 4. Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        state JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Nile Database tables verified.');
  } catch (err) {
    console.error('Nile Database initialization failed:', err.message);
    if (process.env.NODE_ENV === 'production') throw err;
  }
}

/**
 * Returns common collections/tables.
 */
async function getCollections() {
  const db = await getPool();
  if (db) {
    if (!initPromise) initPromise = ensureTables(db);
    await initPromise;
  }
  
  return {
    db,
    searchCache: 'search_cache',
    audit: 'admin_audit',
    bookings: 'bookings',
    users: 'users'
  };
}

// --- Helper Functions (Legacy compatibility with mongo.js) ---

async function getCache(collection, key) {
  const db = await getPool();
  if (!db) return null;

  try {
    const res = await db.query(
      'SELECT payload, meta, expires_at FROM search_cache WHERE key = $1 AND expires_at > CURRENT_TIMESTAMP',
      [key]
    );
    if (res.rows.length === 0) return null;
    return {
      payload: res.rows[0].payload,
      meta: res.rows[0].meta || {},
      expiresAt: res.rows[0].expires_at
    };
  } catch (err) {
    return null;
  }
}

async function setCache(collection, key, payload, ttlMs, meta = {}) {
  const db = await getPool();
  if (!db) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  try {
    await db.query(`
      INSERT INTO search_cache (key, payload, meta, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key) DO UPDATE
      SET payload = EXCLUDED.payload, meta = EXCLUDED.meta, expires_at = EXCLUDED.expires_at, updated_at = CURRENT_TIMESTAMP
    `, [key, JSON.stringify(payload), JSON.stringify(meta), expiresAt]);
  } catch (err) {}

  return { key, payload, meta, expiresAt };
}

async function writeAudit(collection, event) {
  const db = await getPool();
  if (!db) return;
  
  try {
    await db.query('INSERT INTO admin_audit (event) VALUES ($1)', [JSON.stringify(event)]);
  } catch (err) {
    console.warn("Audit log write failed:", err.message);
  }
}

function getAdminPin() {
  const pin = String(process.env.ADMIN_PIN || "").trim();
  if (!pin) {
    throw new Error("ADMIN_PIN is not configured");
  }
  return pin;
}

module.exports = {
  getAdminPin,
  getCache,
  getCollections,
  getPool,
  isDbConfigured,
  setCache,
  writeAudit
};
