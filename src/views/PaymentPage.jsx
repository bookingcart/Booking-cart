'use client';
import { useEffect, useState } from 'react';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { useBookingState, setBookingState, formatMoney } from '../hooks/useBookingState.ts';
import { useSession, signIn, signUp } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc';

export default function PaymentPage() {
  const { state } = useBookingState();
  const { data: session } = useSession();
  const [error, setError] = useState('');

  // Inline auth state — shown to guests before payment
  const [authTab, setAuthTab] = useState('signup'); // 'signup' | 'signin'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authSkipped, setAuthSkipped] = useState(false);

  // Pre-fill email from passenger contact form
  useEffect(() => {
    if (state.contact?.email) setAuthEmail(state.contact.email);
  }, [state.contact?.email]);

  async function handleAuth(e) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authTab === 'signup') {
        const { error: err } = await signUp.email({
          email: authEmail,
          password: authPassword,
          name: authName.trim() || authEmail.split('@')[0],
        });
        if (err) { setAuthError(err.message ?? 'Sign up failed.'); setAuthLoading(false); return; }
      } else {
        const { error: err } = await signIn.email({ email: authEmail, password: authPassword });
        if (err) { setAuthError(err.message ?? 'Invalid email or password.'); setAuthLoading(false); return; }
      }
      // useSession() updates automatically — card disappears and userId is ready
    } catch {
      setAuthError('Authentication failed. Please try again.');
    }
    setAuthLoading(false);
  }
  const saveBooking = trpc.bookings.save.useMutation();
  const checkout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess(data) {
      if (data.url) window.location.href = data.url;
    },
    onError(err) {
      setError(err.message ?? 'Failed to create checkout session.');
    },
  });

  const loading = saveBooking.isPending || checkout.isPending;

  useEffect(() => { document.title = 'BookingCart — Payment'; }, []);

  const flightPrice = Number(state.selectedFlight?.total_amount ?? 0);
  const extrasTotal = state.extrasTotal ?? 0;
  const total = flightPrice + extrasTotal;
  const currency = state.selectedFlight?.total_currency ?? 'USD';

  async function handleCheckout() {
    setError('');

    // Ensure a stable booking ref exists and is persisted to localStorage
    let ref = state.bookingRef;
    if (!ref) {
      ref = 'BC' + Math.random().toString(36).slice(2, 8).toUpperCase();
      setBookingState({ bookingRef: ref });
    }

    const s = state.search;
    const fromCode = s?.from?.match(/\(([A-Z]{3})\)/)?.[1] ?? s?.from?.slice(-3) ?? '';
    const toCode   = s?.to?.match(/\(([A-Z]{3})\)/)?.[1]   ?? s?.to?.slice(-3)   ?? '';
    const route = fromCode && toCode ? `${fromCode} → ${toCode}` : '';

    // Save the pending booking to DB before redirecting to Stripe
    try {
      await saveBooking.mutateAsync({
        booking: {
          ref,
          status: 'new',
          route,
          dates: s ? { depart: s.depart ?? '', ...(s.return ? { return: s.return } : {}) } : undefined,
          flight: state.selectedFlight ?? undefined,
          passengers: state.passengerDetails,
          contact: state.contact,
          extras: Object.fromEntries((state.extras ?? []).map((e) => [e.id, e])),
          total: Math.round(total * 100),
          userId: session?.user?.id ?? undefined,
        },
      });
    } catch {
      // Non-fatal — proceed to Stripe even if the pre-save fails
    }

    checkout.mutate({
      amountCents: Math.round(total * 100),
      currency,
      description: `BookingCart booking`,
      bookingRef: ref,
      successPath: '/confirmation',
      cancelPath: '/payment',
      customerEmail: state.contact?.email ?? '',
      origin: window.location.origin,
    });
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <div className="hidden lg:flex items-center gap-4">
              <a href="/extras" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                <i className="ph-bold ph-arrow-left"></i> Back to extras
              </a>
            </div>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8 overflow-x-auto no-scrollbar text-sm font-medium">
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border-green-100 border whitespace-nowrap" href="/">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">1</span>
              Search
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border-green-100 border whitespace-nowrap" href="/results">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">2</span>
              Results
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border-green-100 border whitespace-nowrap" href="/details">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">3</span>
              Details
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border-green-100 border whitespace-nowrap" href="/passengers">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">4</span>
              Passengers
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border-green-100 border whitespace-nowrap" href="/extras">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">5</span>
              Extras
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white border-slate-900 border whitespace-nowrap" href="/payment">
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">6</span>
              Payment
            </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Payment</h1>
              <p className="text-slate-500 font-medium">
                You will pay <span className="font-bold text-slate-900">{formatMoney(total, currency)}</span> via secure Stripe checkout.
              </p>
            </div>

            {/* Inline auth — shown to guests who haven't skipped */}
            {!session?.user && !authSkipped && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start gap-3 mb-5">
                  <i className="ph ph-user-circle-plus text-2xl text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">Save this booking to your account</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Sign in or create a free account — takes 10 seconds, and you can track and manage your booking anytime.</p>
                  </div>
                </div>

                {/* Tab toggle */}
                <div className="flex gap-1 bg-white rounded-xl p-1 border border-blue-100 mb-5">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signup'); setAuthError(''); }}
                    className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
                      authTab === 'signup' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signin'); setAuthError(''); }}
                    className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
                      authTab === 'signin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sign In
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-3">
                  {authTab === 'signup' && (
                    <input
                      type="text"
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      placeholder="Full name"
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  )}
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder={authTab === 'signup' ? 'Choose a password (min. 8 chars)' : 'Password'}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                  {authError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{authError}</p>}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl transition-colors"
                  >
                    {authLoading
                      ? <><i className="ph ph-circle-notch animate-spin mr-1" />Saving…</>
                      : authTab === 'signup' ? 'Create Account & Continue' : 'Sign In & Continue'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setAuthSkipped(true)}
                  className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Skip — continue as guest →
                </button>
              </div>
            )}

            {/* Signed-in confirmation strip */}
            {session?.user && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3">
                <i className="ph-fill ph-check-circle text-green-600 text-xl shrink-0" />
                <p className="text-sm font-medium text-green-800">
                  Signed in as <strong>{session.user.email}</strong> — booking will be saved to your account.
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <i className="ph-duotone ph-shield-check text-green-600 text-xl"></i> Stripe Secure Checkout
              </h2>
              <p className="text-sm text-slate-500 leading-6 mb-6">
                BookingCart will redirect you to Stripe's secure hosted checkout. Card details are never entered on this site.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {[['Security', 'PCI handled by Stripe'], ['Encryption', '256-bit TLS'], ['Refunds', 'Fare rules apply']].map(([label, val]) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{val}</div>
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>}
              <button
                onClick={handleCheckout}
                disabled={loading || !state.selectedFlight}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><i className="ph ph-circle-notch animate-spin"></i> Redirecting…</> : <><i className="ph-bold ph-lock"></i> Pay {formatMoney(total, currency)}</>}
              </button>
            </div>
          </section>

          <aside className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-24">
              <h2 className="font-medium text-lg text-slate-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="text-slate-500">Flight</span><span className="font-semibold">{formatMoney(flightPrice, currency)}</span></div>
                {(state.extras ?? []).map((e, i) => (
                  <div key={i} className="flex justify-between text-green-700">
                    <span>{e.label}</span><span>+{formatMoney(e.price, currency)}</span>
                  </div>
                ))}
              </div>
              <hr className="border-slate-100 my-4" />
              <div className="flex justify-between items-end">
                <span className="font-medium text-slate-700">Total</span>
                <span className="text-2xl font-semibold text-green-600">{formatMoney(total, currency)}</span>
              </div>
              <div className="text-xs text-right text-slate-400 mt-1">Includes taxes and fees</div>
            </div>
          </aside>
        </div>
      </main>
      <FlightFooter />
    </>
  );
}
