import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { db } from '@/db';
import { platformSettings } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Default settings seeded on first admin visit
// ---------------------------------------------------------------------------

const DEFAULTS: Array<{
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
  group: string;
  value: string;
}> = [
  { key: 'service_fee_pct', label: 'Service Fee (%)', type: 'number', group: 'pricing', value: '0' },
  { key: 'markup_pct', label: 'Markup (%)', type: 'number', group: 'pricing', value: '0' },
  { key: 'support_email', label: 'Support Email', type: 'string', group: 'contact', value: '' },
  { key: 'support_phone', label: 'Support Phone', type: 'string', group: 'contact', value: '' },
  { key: 'site_name', label: 'Site Name', type: 'string', group: 'branding', value: 'BookingCart' },
  { key: 'site_tagline', label: 'Site Tagline', type: 'string', group: 'branding', value: 'Book flights & stays with ease' },
  { key: 'visa_enabled', label: 'Visa Applications Enabled', type: 'boolean', group: 'features', value: 'true' },
  { key: 'stays_enabled', label: 'Hotel Stays Enabled', type: 'boolean', group: 'features', value: 'true' },
  { key: 'events_enabled', label: 'Events Page Enabled', type: 'boolean', group: 'features', value: 'true' },
];

const PUBLIC_KEYS = ['support_email', 'support_phone', 'site_name', 'site_tagline'];

export const settingsRouter = router({
  // Admin — get all settings
  list: adminProcedure.query(async () => {
    const rows = await db.select().from(platformSettings);
    return { settings: rows };
  }),

  // Admin — idempotent seed: insert missing defaults
  seed: adminProcedure.mutation(async () => {
    const existing = await db.select({ key: platformSettings.key }).from(platformSettings);
    const existingKeys = new Set(existing.map((r) => r.key));

    const toInsert = DEFAULTS.filter((d) => !existingKeys.has(d.key));
    if (toInsert.length > 0) {
      await db.insert(platformSettings).values(
        toInsert.map((d) => ({
          key: d.key,
          value: d.value,
          label: d.label,
          type: d.type,
          group: d.group,
          updatedAt: new Date(),
        })),
      );
    }

    return { seeded: toInsert.length };
  }),

  // Admin — update a single setting value
  update: adminProcedure
    .input(z.object({ key: z.string().min(1), value: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(platformSettings)
        .set({ value: input.value, updatedAt: new Date() })
        .where(eq(platformSettings.key, input.key));
      return { ok: true };
    }),

  // Public — get safe/public settings only
  getPublic: publicProcedure.query(async () => {
    const rows = await db
      .select()
      .from(platformSettings)
      .where(inArray(platformSettings.key, PUBLIC_KEYS));
    const map: Record<string, string> = {};
    rows.forEach((r) => { map[r.key] = r.value; });
    return { settings: map };
  }),
});
