import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// The pool is constructed eagerly so `db` has full Drizzle schema types,
// but it won't attempt a real connection until a query is executed at
// runtime.  This means the module can be imported during `next build`
// without DATABASE_URL being set.
const url = process.env.DATABASE_URL ?? '';

const pool = new Pool({
  connectionString: url || undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: url.includes('niledb.com') || url.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
});

export const db = drizzle(pool, { schema });

export type {
  User,
  NewUser,
  Session,
  Account,
  Booking,
  NewBooking,
  AdminAudit,
  SearchCache,
} from './schema';
