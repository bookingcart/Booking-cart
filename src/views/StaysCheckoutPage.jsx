'use client';
import { useEffect, useState } from 'react';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { trpc } from '@/lib/trpc';

export default function StaysCheckoutPage() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const createCheckout = trpc.stripe.createCheckoutSession.useMutation();

  useEffect(() => {
    document.title = 'BookingCart — Stays Checkout';
    try {
      const stored = localStorage.getItem('bookingcart_stay_v1');
      if (stored) setBooking(JSON.parse(stored));
    } catch {}
  }, []);

  async function handlePay() {
    setLoading(true);
    setError('');
    try {
      const data = await createCheckout.mutateAsync({
        type: 'stay',
        ...booking,
        origin: window.location.origin,
      });
      if (data.url) window.location.href = data.url;
      else setError('Failed to create checkout session');
    } catch (err) { setError(err?.message ?? 'Payment setup failed.'); }
    setLoading(false);
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <a href="/stays/details" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              <i className="ph-bold ph-arrow-left"></i> Back to details
            </a>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>
        {booking && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="font-medium text-lg text-slate-900 mb-4">{booking.stay?.name}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Destination</span><span className="font-semibold">{booking.destination}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Check-in</span><span className="font-semibold">{booking.checkIn}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Check-out</span><span className="font-semibold">{booking.checkOut}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Guests</span><span className="font-semibold">{booking.guests}</span></div>
            </div>
          </div>
        )}
        {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}
        <button onClick={handlePay} disabled={loading || !booking}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
          {loading ? <><i className="ph ph-circle-notch animate-spin" /> Redirecting…</> : <><i className="ph-bold ph-lock" /> Pay Securely via Stripe</>}
        </button>
      </main>
    </>
  );
}
