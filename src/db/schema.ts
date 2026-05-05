import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const bookingStatusEnum = pgEnum('booking_status', [
  'new',
  'confirmed',
  'cancelled',
  'ticket_issued',
  'refunded',
]);

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// ---------------------------------------------------------------------------
// better-auth required tables
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  // better-auth admin plugin
  role: text('role').default('user'), // kept as text — better-auth admin plugin reads it as string
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { mode: 'date' }),
  // user-editable settings
  preferences: jsonb('preferences'),
  notifications: jsonb('notifications'),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'date' }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'date' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

export const bookings = pgTable(
  'bookings',
  {
    id: text('id').primaryKey(),
    ref: text('ref').notNull().unique(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    status: text('status').notNull().default('new'), // new | confirmed | cancelled | ticket_issued | refunded
    // Search context
    tripType: text('trip_type').default('round'), // round | oneway
    route: text('route'),                          // e.g. "LHR → DXB"
    cabin: text('cabin').default('Economy'),
    // Raw JSON blobs from the booking flow
    dates: jsonb('dates').$type<{ depart: string; return?: string }>(),
    flight: jsonb('flight').$type<Record<string, unknown>>(),
    passengers: jsonb('passengers').$type<Array<Record<string, unknown>>>(),
    contact: jsonb('contact').$type<{ email: string; phone?: string; name?: string }>(),
    extras: jsonb('extras').$type<Record<string, unknown>>(),
    // Pricing
    total: integer('total'),                       // in cents (USD)
    currency: text('currency').default('USD'),
    // Payment
    paymentIntentId: text('payment_intent_id'),    // Stripe PaymentIntent or CheckoutSession id
    payment: jsonb('payment').$type<Record<string, unknown>>(),
    // Ticket fulfilment
    ticketUrl: text('ticket_url'),
    ticketNumber: text('ticket_number'),
    ticketAirline: text('ticket_airline'),
    // Booking type: 'flight' | 'stay'
    bookingType: text('booking_type').default('flight'),
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('bookings_user_id_idx').on(t.userId),
    index('bookings_ref_idx').on(t.ref),
    index('bookings_status_idx').on(t.status),
    index('bookings_payment_intent_idx').on(t.paymentIntentId),
    index('bookings_created_at_idx').on(t.createdAt),
  ],
);

export const searchCache = pgTable('search_cache', {
  key: text('key').primaryKey(),
  payload: jsonb('payload').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const visaApplications = pgTable(
  'visa_applications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    userEmail: text('user_email'),
    passport: text('passport').notNull(),
    destination: text('destination').notNull(),
    status: text('status').notNull().default('pending'), // pending | approved | rejected
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('visa_apps_user_id_idx').on(t.userId),
    index('visa_apps_status_idx').on(t.status),
    index('visa_apps_created_at_idx').on(t.createdAt),
  ],
);

export const adminAudit = pgTable(
  'admin_audit',
  {
    id: text('id').primaryKey(),
    adminId: text('admin_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(), // e.g. "booking.cancel", "booking.delete", "user.ban"
    targetId: text('target_id'),      // booking id, user id, etc.
    event: jsonb('event').notNull().$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('admin_audit_admin_id_idx').on(t.adminId),
    index('admin_audit_action_idx').on(t.action),
    index('admin_audit_created_at_idx').on(t.createdAt),
  ],
);

export const flightDeals = pgTable(
  'flight_deals',
  {
    id: text('id').primaryKey(),
    origin: text('origin').notNull(),      // IATA code, e.g. "EBB"
    destination: text('destination').notNull(), // IATA code, e.g. "DXB"
    city: text('city').notNull(),
    country: text('country').notNull(),
    imageUrl: text('image_url'),
    active: boolean('active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('flight_deals_origin_idx').on(t.origin),
    index('flight_deals_active_idx').on(t.active),
  ],
);

export const platformSettings = pgTable('platform_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default(''),
  label: text('label').notNull(),
  type: text('type').notNull().default('string'), // 'string' | 'number' | 'boolean'
  group: text('group').notNull().default('general'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations (for Drizzle query builder / relational queries)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  bookings: many(bookings),
  auditLogs: many(adminAudit),
  visaApplications: many(visaApplications),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
}));

export const adminAuditRelations = relations(adminAudit, ({ one }) => ({
  admin: one(users, { fields: [adminAudit.adminId], references: [users.id] }),
}));

export const visaApplicationsRelations = relations(visaApplications, ({ one }) => ({
  user: one(users, { fields: [visaApplications.userId], references: [users.id] }),
}));

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type AdminAudit = typeof adminAudit.$inferSelect;
export type SearchCache = typeof searchCache.$inferSelect;
export type VisaApplication = typeof visaApplications.$inferSelect;
export type NewVisaApplication = typeof visaApplications.$inferInsert;
export type FlightDeal = typeof flightDeals.$inferSelect;
export type NewFlightDeal = typeof flightDeals.$inferInsert;
export type PlatformSetting = typeof platformSettings.$inferSelect;
