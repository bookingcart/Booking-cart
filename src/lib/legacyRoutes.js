/** Map legacy *.html filenames (pathname tail) to React Router paths. */
export const LEGACY_HTML_TO_ROUTE = {
  'index.html': '/',
  'results.html': '/results',
  'details.html': '/details',
  'passengers.html': '/passengers',
  'extras.html': '/extras',
  'payment.html': '/payment',
  'confirmation.html': '/confirmation',
  'my-bookings.html': '/my-bookings',
  'admin.html': '/admin',
  'account-settings.html': '/account-settings',
  'stays.html': '/stays',
  'stays-results.html': '/stays/results',
  'stays-details.html': '/stays/details',
  'stays-checkout.html': '/stays/checkout',
  'stays-confirmation.html': '/stays/confirmation',
  'events.html': '/events',
  'visa-new.html': '/visa/new',
  'visa-dashboard.html': '/visa/dashboard',
  'visa.html': '/visa',
  'admin-visa.html': '/admin/visa',
  'terms.html': '/terms',
  'privacy.html': '/privacy'
};

/**
 * @param {string} href - e.g. "results.html", "/details.html?x=1", or full URL
 * @returns {string} path for react-router
 */
export function legacyHrefToRoute(href) {
  try {
    const u = new URL(href, window.location.origin);
    const tail = u.pathname.replace(/^.*\//, '') || u.pathname.slice(1) || 'index.html';
    const mapped = LEGACY_HTML_TO_ROUTE[tail];
    if (mapped !== undefined) return mapped + u.search + u.hash;
    if (u.pathname.startsWith('/') && !u.pathname.includes('.html')) {
      return u.pathname + u.search + u.hash;
    }
    return u.pathname + u.search + u.hash;
  } catch {
    return href;
  }
}
