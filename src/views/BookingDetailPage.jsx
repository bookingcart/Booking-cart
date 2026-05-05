'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtMoney(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(cents ?? 0) / 100);
}

export default function BookingDetailPage({ bookingRef: bookingRefProp }) {
  const params = useParams();
  const router = useRouter();
  const bookingRef = bookingRefProp ?? params?.ref ?? '';
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data, isLoading, error: queryError } = trpc.bookings.getOwned.useQuery(
    { ref: bookingRef },
    { enabled: !!bookingRef },
  );
  const b = data?.booking ?? null;

  const currency = b?.flight?.total_currency ?? 'USD';
  const isPending = b?.status === 'new';

  const checkout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess(data) {
      if (data.url) window.location.href = data.url;
    },
  });

  const canCancel = b?.status === 'new' || b?.status === 'confirmed';

  const cancelMutation = trpc.bookings.cancel.useMutation({
    onSuccess() { setShowCancelConfirm(false); router.push('/my-bookings'); },
  });

  function handleDownloadInvoice() {
    const segs = b?.flight?.slices?.[0]?.segments ?? [];
    const first = segs[0]; const last = segs[segs.length - 1];
    const pax = b?.passengers ?? [];
    const rows = pax.map(p => `<tr><td style="padding:6px 12px">${p.given_name ?? ''} ${p.family_name ?? ''}</td><td style="padding:6px 12px">${p.nationality ?? ''}</td><td style="padding:6px 12px">${p.passport_number ?? ''}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>Invoice ${b?.ref ?? ''}</title><style>body{font-family:sans-serif;padding:40px;color:#1e293b}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e2e8f0;text-align:left}th{background:#f8fafc}</style></head><body><h1 style="color:#16a34a">BookingCart Invoice</h1><p><strong>Ref:</strong> ${b?.ref ?? '—'}</p><p><strong>Route:</strong> ${first?.origin?.iata_code ?? '—'} → ${last?.destination?.iata_code ?? '—'}</p><p><strong>Departs:</strong> ${first?.departing_at?.replace('T',' ').slice(0,16) ?? '—'}</p><p><strong>Total:</strong> ${fmtMoney(b?.total, b?.flight?.total_currency)}</p>${rows ? `<h3>Passengers</h3><table><thead><tr><th style="padding:6px 12px">Name</th><th style="padding:6px 12px">Nationality</th><th style="padding:6px 12px">Passport</th></tr></thead><tbody>${rows}</tbody></table>` : ''}<br><button onclick="window.print()">Print</button></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }

  function handlePayNow() {
    checkout.mutate({
      amountCents: Number(b.total ?? 0),
      currency: currency.toLowerCase(),
      description: `BookingCart flight ${b.ref}`,
      bookingRef: b.ref,
      successPath: '/confirmation',
      cancelPath: `/my-bookings/${b.ref}`,
      customerEmail: b.contact?.email ?? '',
      origin: window.location.origin,
    });
  }

  useEffect(() => {
    if (b) document.title = `Booking ${b.ref} · BookingCart`;
  }, [b?.ref]);

  const slice    = b?.flight?.slices?.[0];
  const segments = slice?.segments ?? [];
  const passengers = b?.passengers ?? [];
  const extrasArr  = b?.extras ? Object.values(b.extras) : [];

  // Build a payment timeline from available data
  const paymentEvents = [];
  if (b?.createdAt) {
    paymentEvents.push({ at: b.createdAt, label: 'Booking created', status: 'info' });
  }
  if (b?.payment) {
    const p = b.payment;
    if (p.paymentStatus === 'paid') {
      paymentEvents.push({ at: b.updatedAt ?? b.createdAt, label: `Payment confirmed via Stripe`, sub: p.sessionId, status: 'success' });
    } else if (p.paymentStatus === 'unpaid') {
      paymentEvents.push({ at: b.updatedAt ?? b.createdAt, label: 'Payment initiated but not completed', sub: p.sessionId, status: 'warning' });
    }
  }
  if (b?.status === 'ticket_issued' && b?.ticketNumber) {
    paymentEvents.push({ at: b.updatedAt, label: `Ticket issued — ${b.ticketNumber}`, status: 'success' });
  }
  if (b?.status === 'cancelled') {
    paymentEvents.push({ at: b.updatedAt, label: 'Booking cancelled', status: 'error' });
  }
  if (b?.status === 'refunded') {
    paymentEvents.push({ at: b.updatedAt, label: 'Refund processed', status: 'info' });
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <button
              onClick={() => router.push('/my-bookings')}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <i className="ph ph-arrow-left" /> My Bookings
            </button>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back (mobile) */}
        <button
          onClick={() => router.push('/my-bookings')}
          className="sm:hidden flex items-center gap-1.5 text-sm font-medium text-slate-500 mb-4"
        >
          <i className="ph ph-arrow-left" /> My Bookings
        </button>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1,2,3].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="h-8 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && queryError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <i className="ph ph-warning text-4xl text-red-400 block mb-3" />
            <p className="font-semibold text-red-800">{queryError.message}</p>
            <button onClick={() => router.push('/my-bookings')} className="mt-4 text-sm text-slate-500 underline">
              Back to My Bookings
            </button>
          </div>
        )}

        {b && (
          <div className="space-y-6">
            {/* ── Hero header ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-wider">{b.ref}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm">
                    {b.route ?? '—'} &middot; Booked {fmtDate(b.createdAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-3xl font-extrabold text-green-600">{fmtMoney(b.total, currency)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{isPending ? 'Amount due' : 'Total paid'}</div>
                  <div className="flex flex-wrap gap-2 justify-end mt-3">
                    {isPending && (
                      <button
                        onClick={handlePayNow}
                        disabled={checkout.isPending}
                        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
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
                        className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
                      >
                        <i className="ph ph-file-pdf" /> Download Ticket
                      </a>
                    )}
                    <button
                      onClick={handleDownloadInvoice}
                      className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
                    >
                      <i className="ph ph-receipt" /> Invoice
                    </button>
                    {canCancel && !showCancelConfirm && (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="inline-flex items-center gap-1.5 border border-red-200 hover:border-red-400 text-red-600 hover:text-red-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
                      >
                        <i className="ph ph-x-circle" /> Cancel
                      </button>
                    )}
                  </div>
                  {showCancelConfirm && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
                      <span className="text-red-800 text-sm font-medium flex-1">Cancel booking {b.ref}?</span>
                      <button onClick={() => cancelMutation.mutate({ ref: b.ref })} disabled={cancelMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                        {cancelMutation.isPending ? 'Cancelling…' : 'Yes, cancel'}
                      </button>
                      <button onClick={() => setShowCancelConfirm(false)}
                        className="text-slate-500 text-xs font-bold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                        Keep
                      </button>
                    </div>
                  )}
                  {checkout.error && (
                    <p className="text-red-600 text-xs mt-2 max-w-xs text-right">{checkout.error.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Flight segments ── */}
            {segments.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Flight Details</h2>
                <div className="space-y-3">
                  {segments.map((seg, i) => {
                    const carrier = seg.operating_carrier ?? seg.marketing_carrier ?? {};
                    return (
                      <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                          {carrier.iata_code ?? '✈'}
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="font-extrabold text-slate-900 text-xl">{seg.origin?.iata_code ?? '—'}</div>
                            <div className="text-slate-500 text-xs">{fmt(seg.departing_at)}</div>
                            {seg.origin?.terminal && <div className="text-slate-400 text-xs mt-0.5">Terminal {seg.origin.terminal}</div>}
                          </div>
                          <div className="flex flex-col items-center justify-center text-center">
                            <i className="ph ph-airplane-takeoff text-xl text-slate-400 mb-1" />
                            <span className="text-slate-400 text-xs font-medium leading-tight">{carrier.name ?? ''}</span>
                            {seg.duration && <span className="text-slate-300 text-xs mt-0.5">{seg.duration}</span>}
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-slate-900 text-xl">{seg.destination?.iata_code ?? '—'}</div>
                            <div className="text-slate-500 text-xs">{fmt(seg.arriving_at)}</div>
                            {seg.destination?.terminal && <div className="text-slate-400 text-xs mt-0.5">Terminal {seg.destination.terminal}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Passengers ── */}
            {passengers.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Passengers</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {passengers.map((p, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {(p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')}
                      </div>
                      <div className="text-sm">
                        <div className="font-bold text-slate-800">{[p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || `Passenger ${i + 1}`}</div>
                        {p.dob && <div className="text-slate-400 text-xs mt-0.5">DOB: {fmtDate(p.dob)}</div>}
                        {p.nationality && <div className="text-slate-400 text-xs">Nationality: {p.nationality}</div>}
                        {p.passportNumber && <div className="text-slate-400 text-xs font-mono">Passport: {p.passportNumber}</div>}
                        {p.email && <div className="text-slate-400 text-xs">{p.email}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Contact ── */}
            {b.contact && (b.contact.name || b.contact.email || b.contact.phone) && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Contact Details</h2>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 grid sm:grid-cols-3 gap-4 text-sm">
                  {b.contact.name  && <div><span className="text-slate-400 text-xs font-bold uppercase tracking-wide block mb-0.5">Name</span><span className="font-semibold text-slate-800">{b.contact.name}</span></div>}
                  {b.contact.email && <div><span className="text-slate-400 text-xs font-bold uppercase tracking-wide block mb-0.5">Email</span><span className="font-semibold text-slate-800">{b.contact.email}</span></div>}
                  {b.contact.phone && <div><span className="text-slate-400 text-xs font-bold uppercase tracking-wide block mb-0.5">Phone</span><span className="font-semibold text-slate-800">{b.contact.phone}</span></div>}
                </div>
              </section>
            )}

            {/* ── Extras ── */}
            {extrasArr.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Extras</h2>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-wrap gap-2">
                  {extrasArr.map((ex, i) => (
                    <span key={i} className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      {ex.name ?? ex.id ?? `Extra ${i + 1}`}
                      {ex.price != null && (
                        <span className="text-green-600">+{fmtMoney(ex.price * 100, currency)}</span>
                      )}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ── Payment History ── */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Payment History</h2>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-5">
                {paymentEvents.length === 0 ? (
                  <p className="text-slate-400 text-sm">No payment activity yet.</p>
                ) : (
                  <ol className="relative border-l border-slate-200 ml-2 space-y-5">
                    {paymentEvents.map((ev, i) => {
                      const dot = ev.status === 'success' ? 'bg-green-500' :
                                  ev.status === 'error'   ? 'bg-red-400'   :
                                  ev.status === 'warning' ? 'bg-amber-400' : 'bg-slate-400';
                      return (
                        <li key={i} className="ml-5">
                          <span className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${dot}`} />
                          <p className="text-sm font-semibold text-slate-800">{ev.label}</p>
                          {ev.sub && <p className="text-xs font-mono text-slate-400 mt-0.5 break-all">{ev.sub}</p>}
                          <p className="text-xs text-slate-400 mt-0.5">{fmt(ev.at)}</p>
                        </li>
                      );
                    })}
                  </ol>
                )}

                {/* Payment summary box */}
                {b.payment?.paymentStatus === 'paid' && (
                  <div className="mt-5 pt-5 border-t border-slate-100 grid sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wide block mb-0.5">Amount Paid</span>
                      <span className="font-bold text-slate-800">
                        {fmtMoney(b.payment.amountTotal, b.payment.currency?.toUpperCase() ?? 'USD')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wide block mb-0.5">Provider</span>
                      <span className="font-bold text-slate-800 capitalize">{b.payment.provider ?? 'Stripe'}</span>
                    </div>
                    {b.payment.sessionId && (
                      <div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wide block mb-0.5">Session ID</span>
                        <span className="font-mono text-xs text-slate-500 break-all">{b.payment.sessionId}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ── Booking meta ── */}
            <div className="text-xs text-slate-400 flex flex-wrap gap-4 px-1 pb-2">
              <span>Booking ID: <span className="font-mono text-slate-600">{b.id}</span></span>
              {b.paymentIntentId && <span>Stripe ref: <span className="font-mono text-slate-600">{b.paymentIntentId}</span></span>}
              {b.updatedAt && <span>Last updated: {fmt(b.updatedAt)}</span>}
            </div>
          </div>
        )}
      </main>

      <FlightFooter />
    </>
  );
}
