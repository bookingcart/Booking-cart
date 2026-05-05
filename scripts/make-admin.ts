/**
 * Usage: npm run make-admin -- <email>
 * Sets the given user's role to 'admin' in the database.
 */
import 'dotenv/config';
import { db } from '../src/db/index';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run make-admin -- <email>');
  process.exit(1);
}

async function main() {
  const [user] = await db.select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.email, email));

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
  console.log(`✓ ${email} is now an admin.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
