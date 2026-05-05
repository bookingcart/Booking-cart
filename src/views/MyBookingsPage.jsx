'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { trpc } from '@/lib/trpc';

const STATUS_COLORS = {
  new:           'bg-amber-100 text-amber-700',
  confirmed:     'bg-green-100 text-green-700',
  ticket_issued: 'bg-purple-100 text-purple-700',
  cancelled:     'bg-red-100 text-red-700',
  refunded:      'bg-slate-100 text-slate-500',
};

const STATUS_LABELS = {
  new:           'Pending Payment',
  confirmed:     'Confirmed',
  ticket_issued: 'Ticket Issued',
  cancelled:     'Cancelled',
  refunded:      'Refunded',
};

function BookingCard({ b }) {
  const router = useRouter();
  const [payError, setPayError] = useState('');

  const checkout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess(data) {
      if (data.url) window.location.href = data.url;
    },
    onError(err) {
      setPayError(err.message ?? 'Failed to start checkout. Please try again.');
    },
  });

  function handlePayNow(e) {
    e.stopPropagation();
    setPayError('');
    checkout.mutate({
      amountCents: Number(b.total ?? 0),
      currency: (b.flight?.total_currency ?? 'USD').toLowerCase(),
      description: `BookingCart flight ${b.ref}`,
      bookingRef: b.ref,
      successPath: '/confirmation',
      cancelPath: '/my-bookings',
      customerEmail: b.contact?.email ?? '',
      origin: window.location.origin,
    });
  }

  const currency  = b.flight?.total_currency ?? 'USD';
  const isPending = b.status === 'new';

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row gap-4 cursor-pointer hover:border-green-200 hover:shadow-md transition-all"
      onClick={() => router.push(`/my-bookings/${b.ref}`)}
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-extrabold text-slate-900 tracking-widest text-lg">{b.ref}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
            {STATUS_LABELS[b.status] ?? b.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div><span className="text-slate-400">From</span> <span className="font-semibold text-slate-800">{b.route?.split(' → ')?.[0] ?? '—'}</span></div>
          <div><span className="text-slate-400">To</span> <span className="font-semibold text-slate-800">{b.route?.split(' → ')?.[1] ?? '—'}</span></div>
          <div><span className="text-slate-400">Departs</span> <span className="font-semibold text-slate-800">{b.dates?.depart ? new Date(b.dates.depart).toLocaleDateString() : '—'}</span></div>
          <div><span className="text-slate-400">Passengers</span> <span className="font-semibold text-slate-800">{b.passengers?.length || '—'}</span></div>
        </div>
      </div>

      <div className="sm:text-right shrink-0 flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
        <div className="text-2xl font-extrabold text-green-600">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(b.total ?? 0) / 100)}
        </div>
        <div className="text-xs text-slate-400">{isPending ? 'Amount due' : 'Total paid'}</div>
        <div className="flex flex-wrap gap-2 justify-end mt-1">
          {isPending && (
            <button
              onClick={handlePayNow}
              disabled={checkout.isPending}
              className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <i className="ph ph-credit-card" />
              {checkout.isPending ? 'Redirecting…' : 'Pay Now'}
            </button>
          )}
          {b.ticketUrl && (
            <a
              href={b.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <i className="ph ph-file-pdf" /> Download Ticket
            </a>
          )}
          <button
            onClick={() => router.push(`/my-bookings/${b.ref}`)}
            className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-green-300 text-slate-600 hover:text-green-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <i className="ph ph-arrow-square-out" /> View Details
          </button>
        </div>
        {payError && <p className="text-red-600 text-xs mt-1 max-w-xs text-right">{payError}</p>}
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const { data, isLoading: loading, error: queryError } = trpc.bookings.myBookings.useQuery();
  const bookings = data?.bookings ?? [];
  const error = queryError?.message ?? '';

  useEffect(() => {
    document.title = 'BookingCart — My Bookings';
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
          <HeaderAuthCluster />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-slate-500 font-medium mt-1">All your flight bookings in one place.</p>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="h-8 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <i className="ph ph-warning text-3xl text-red-500 mb-2 block" />
            <p className="font-medium text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-20">
            <i className="ph ph-airplane text-5xl text-slate-200 mb-4 block" />
            <h2 className="text-xl font-bold text-slate-400">No bookings yet</h2>
            <p className="text-slate-400 mb-6">Your pending and confirmed bookings will appear here.</p>
            <a href="/" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all">Search Flights</a>
          </div>
        )}

        <div className="space-y-4">
          {bookings.map((b) => <BookingCard key={b.id} b={b} />)}
        </div>
      </main>

      <FlightFooter />
    </div>
  );
}
