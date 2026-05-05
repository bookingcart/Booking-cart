'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { useBookingState, formatMoney } from '../hooks/useBookingState.ts';
import { useSession } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const { state, hydrated } = useBookingState();
  const { data: session } = useSession();
  const confirmedRef = useRef(false);

  const sessionId = searchParams.get('session_id');
  const bookingRef = searchParams.get('ref') ?? (hydrated ? (state.bookingRef ?? '') : '') ?? '';

  const utils = trpc.useUtils();
  const saveBooking = trpc.bookings.save.useMutation({
    onSuccess: () => utils.bookings.getByRef.invalidate(),
  });

  const { data, isLoading: loading } = trpc.bookings.getByRef.useQuery(
    { ref: bookingRef || undefined, sessionId: sessionId || undefined },
    { enabled: !!(bookingRef || sessionId) },
  );
  const booking = data?.booking ?? null;

  // Query the Stripe session to verify payment status
  const { data: sessionData } = trpc.stripe.getSession.useQuery(
    { sessionId: sessionId ?? '' },
    { enabled: !!sessionId },
  );

  // Once Stripe confirms payment, persist the booking as 'confirmed'
  useEffect(() => {
    if (confirmedRef.current) return;
    const sess = sessionData?.session;
    if (!sess || sess.payment_status !== 'paid') return;
    const ref = sess.client_reference_id || bookingRef;
    if (!ref) return;
    confirmedRef.current = true;
    saveBooking.mutate({
      booking: {
        ref,
        status: 'confirmed',
        paymentIntentId: sess.id,
        userId: session?.user?.id ?? undefined,
        payment: {
          provider: 'stripe',
          sessionId: sess.id,
          paymentStatus: sess.payment_status,
          amountTotal: sess.amount_total,
          currency: sess.currency,
        },
      },
    });
  }, [sessionData?.session?.id]);

  useEffect(() => { document.title = 'BookingCart — Booking Confirmed!'; }, []);

  const flight = state.selectedFlight;
  const slice = flight?.slices?.[0];
  const seg0 = slice?.segments?.[0];
  const lastSeg = slice?.segments?.[slice.segments.length - 1];
  const passengerList = state.passengers ?? [];

  function handleDownloadInvoice() {
    const rows = passengerList.map(p => `<tr><td style="padding:6px 12px">${p.given_name ?? ''} ${p.family_name ?? ''}</td><td style="padding:6px 12px">${p.nationality ?? ''}</td><td style="padding:6px 12px">${p.passport_number ?? ''}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>Invoice ${state.bookingRef ?? ''}</title><style>body{font-family:sans-serif;padding:40px;color:#1e293b}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e2e8f0;text-align:left}th{background:#f8fafc}</style></head><body><h1 style="color:#16a34a">BookingCart Invoice</h1><p><strong>Ref:</strong> ${state.bookingRef ?? '—'}</p><p><strong>Route:</strong> ${seg0?.origin?.iata_code ?? '—'} → ${lastSeg?.destination?.iata_code ?? '—'}</p><p><strong>Departs:</strong> ${seg0?.departing_at?.replace('T',' ').slice(0,16) ?? '—'}</p><p><strong>Total:</strong> ${flight ? new Intl.NumberFormat('en-US',{style:'currency',currency:flight.total_currency??'USD'}).format(Number(flight.total_amount)) : '—'}</p>${rows ? `<h3>Passengers</h3><table><thead><tr><th style="padding:6px 12px">Name</th><th style="padding:6px 12px">Nationality</th><th style="padding:6px 12px">Passport</th></tr></thead><tbody>${rows}</tbody></table>` : ''}<br><button onclick="window.print()">Print</button></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
          <HeaderAuthCluster />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-12 max-w-3xl">
        {loading ? (
          <div className="text-center py-20">
            <i className="ph ph-circle-notch animate-spin text-4xl text-slate-300 block mb-4" />
            <p className="text-slate-400">Loading booking confirmation…</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <i className="ph-fill ph-check-circle text-4xl text-green-600"></i>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
              <p className="text-slate-500 font-medium">Your booking has been confirmed. Check your email for your e-ticket.</p>
            </div>

            {(booking?.reference || bookingRef) && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-6">
                <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Booking Reference</div>
                <div className="text-3xl font-extrabold text-green-700 tracking-widest">{booking?.reference ?? bookingRef}</div>
              </div>
            )}

            {flight && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                <h2 className="font-medium text-lg text-slate-900 mb-4">Flight Summary</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><div className="text-slate-500">From</div><div className="font-semibold">{seg0?.origin?.city_name} ({seg0?.origin?.iata_code})</div></div>
                  <div><div className="text-slate-500">To</div><div className="font-semibold">{lastSeg?.destination?.city_name} ({lastSeg?.destination?.iata_code})</div></div>
                  <div><div className="text-slate-500">Departs</div><div className="font-semibold">{seg0?.departing_at?.replace('T', ' ').slice(0, 16) ?? '—'}</div></div>
                  <div><div className="text-slate-500">Cabin</div><div className="font-semibold">{state.search?.cabin ?? 'Economy'}</div></div>
                  <div className="col-span-2">
                    <div className="text-slate-500">Total Paid</div>
                    <div className="text-2xl font-bold text-green-600">{formatMoney(Number(flight.total_amount), flight.total_currency)}</div>
                  </div>
                </div>
              </div>
            )}

            {passengerList.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                <h2 className="font-medium text-lg text-slate-900 mb-4">Passengers</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {passengerList.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                        {(p.given_name?.[0] ?? '') + (p.family_name?.[0] ?? '')}
                      </div>
                      <div className="text-sm">
                        <div className="font-semibold text-slate-900">{p.given_name} {p.family_name}</div>
                        <div className="text-slate-500 text-xs">{p.nationality ?? ''}{p.passport_number ? ` · ${p.passport_number}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/my-bookings" className="flex-1 bg-slate-900 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-center transition-all">View My Bookings</a>
              <button onClick={handleDownloadInvoice} className="flex-1 border-2 border-green-600 text-green-700 font-bold py-3 rounded-xl text-center hover:bg-green-50 transition-all flex items-center justify-center gap-2">
                <i className="ph ph-receipt" /> Download Invoice
              </button>
              <a href="/" className="flex-1 border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-center hover:bg-slate-50 transition-all">Book Another Flight</a>
            </div>

            {!session?.user && state.contact?.email && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6 text-center">
                <i className="ph ph-user-circle-plus text-3xl text-blue-500 mb-3 block" />
                <h3 className="font-bold text-slate-900 text-lg mb-1">Save this booking to your account</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Create a free account with <strong>{state.contact.email}</strong> to track your booking, receive updates, and book faster next time.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={`/sign-up?email=${encodeURIComponent(state.contact.email)}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
                  >
                    Create Account
                  </a>
                  <a
                    href="/sign-in"
                    className="border border-blue-300 text-blue-700 font-bold px-6 py-2.5 rounded-xl hover:bg-blue-100 transition-colors text-sm"
                  >
                    Sign In
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <FlightFooter />
    </>
  );
}
