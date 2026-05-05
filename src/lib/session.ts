import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Call in a Server Component or Route Handler to require an authenticated session.
 * Redirects to /sign-in if not authenticated.
 */
export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');
  return session;
}

/**
 * Call in a Server Component or Route Handler to require admin role.
 * Redirects to / if not authenticated or not admin.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');
  if (session.user.role !== 'admin') redirect('/');
  return session;
}

/**
 * Returns session or null — does NOT redirect. Safe to use in layouts.
 */
export async function getOptionalSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}
