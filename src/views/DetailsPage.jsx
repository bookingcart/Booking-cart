'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { useBookingState, setBookingState, formatDuration, formatMoney } from '../hooks/useBookingState.ts';

function SegmentRow({ seg }) {
  const dep = seg.departing_at?.replace('T', ' ').slice(0, 16) ?? '—';
  const arr = seg.arriving_at?.replace('T', ' ').slice(0, 16) ?? '—';
  return (
    <div className="flex flex-col sm:flex-row gap-4 py-4">
      <div className="flex items-center gap-3 sm:w-44 shrink-0">
        {seg.marketing_carrier?.logo_symbol_url
          ? <img src={seg.marketing_carrier.logo_symbol_url} alt={seg.marketing_carrier.name} className="w-10 h-10 rounded-lg object-contain border border-slate-100" />
          : <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">{(seg.marketing_carrier?.name ?? 'XX').slice(0,2)}</div>}
        <div>
          <div className="font-semibold text-slate-900 text-sm">{seg.marketing_carrier?.name}</div>
          <div className="text-xs text-slate-400">{seg.marketing_carrier_flight_number}</div>
        </div>
      </div>
      <div className="flex-1 space-y-1 text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <i className="ph ph-airplane-takeoff text-green-600" />
          <span className="font-semibold">{dep}</span>
          <span className="text-slate-400">· {seg.origin?.iata_code} — {seg.origin?.city_name}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <i className="ph ph-airplane-landing text-slate-400" />
          <span className="font-semibold">{arr}</span>
          <span className="text-slate-400">· {seg.destination?.iata_code} — {seg.destination?.city_name}</span>
        </div>
        <div className="text-xs text-slate-400">{formatDuration(seg.duration ?? 0)} · {seg.aircraft?.name ?? 'Aircraft'}</div>
      </div>
    </div>
  );
}

export default function DetailsPage() {
  const router = useRouter();
  const { state } = useBookingState();
  const flight = state.selectedFlight;

  useEffect(() => { document.title = 'BookingCart — Details'; }, []);

  function continueToPassengers() {
    router.push('/passengers');
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">No flight selected.</p>
        <a href="/results" className="text-green-600 font-semibold hover:underline">← Back to results</a>
      </div>
    );
  }

  const slice1 = flight.slices?.[0];
  const slice2 = flight.slices?.[1];
  const airline = slice1?.segments?.[0]?.marketing_carrier?.name ?? '—';
  const dep = slice1?.segments?.[0]?.departing_at?.slice(11, 16) ?? '—';
  const arr = slice1?.segments?.[slice1.segments.length - 1]?.arriving_at?.slice(11, 16) ?? '—';
  const dur = formatDuration(slice1?.duration ?? 0);
  const price = formatMoney(Number(flight.total_amount), flight.total_currency);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <div className="hidden lg:flex items-center gap-4">
              <a href="/results" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                <i className="ph-bold ph-arrow-left"></i> Back to results
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
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white border-slate-900 border whitespace-nowrap" href="/details">
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">3</span>
              Details
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-500 border-slate-200 border whitespace-nowrap" href="#">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">4</span>
              Passengers
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-500 border-slate-200 border whitespace-nowrap" href="#">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">5</span>
              Extras
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-500 border-slate-200 border whitespace-nowrap" href="#">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">6</span>
              Payment
            </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 space-y-6">
            <div>
              <h1 className="text-2xl font-medium text-slate-900">Flight Details</h1>
              <p className="text-slate-500 font-medium">Review the full breakdown, fare rules, and baggage allowances.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-medium text-lg text-slate-900 mb-4 flex items-center gap-2">
                <i className="ph-duotone ph-airplane-tilt text-green-600 text-xl"></i> Trip Breakdown
              </h2>
              <hr className="border-slate-100 my-4" />
              {slice1?.segments?.map((seg, i) => (
                <div key={i}>
                  <SegmentRow seg={seg} />
                  {i < slice1.segments.length - 1 && (
                    <div className="text-xs font-medium text-amber-600 bg-amber-50 rounded-xl px-3 py-2 my-2">
                      Layover at {seg.destination?.iata_code}
                    </div>
                  )}
                </div>
              ))}
              {slice2 && (
                <>
                  <hr className="border-dashed border-slate-200 my-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Return flight</p>
                  {slice2.segments?.map((seg, i) => <SegmentRow key={i} seg={seg} />)}
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-medium text-lg text-slate-900 mb-4 flex items-center gap-2">
                <i className="ph-duotone ph-receipt text-green-600 text-xl"></i> Fare Rules
              </h2>
              <div className="space-y-3">
                {[['Refund Policy', 'Refundable with fee'], ['Changes', 'Allowed (fare difference applies)'], ['No-show', 'Ticket forfeited']].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-medium text-slate-700 text-sm">{k}</span>
                    <span className="text-sm font-semibold text-slate-500">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-medium text-lg text-slate-900 mb-4 flex items-center gap-2">
                <i className="ph-duotone ph-suitcase text-green-600 text-xl"></i> Baggage
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[['ph-bag', 'Personal Item', 'Included'], ['ph-suitcase-rolling', 'Carry-on', '7kg Included'], ['ph-archive-box', 'Checked Bag', '0–1 (Varies)']].map(([icon, name, info]) => (
                  <div key={name} className="p-4 rounded-xl bg-slate-50 text-center">
                    <i className={`ph-fill ${icon} text-2xl text-slate-400 mb-2 block`}></i>
                    <div className="font-medium text-slate-900 text-sm">{name}</div>
                    <div className="text-xs text-slate-500">{info}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-24">
              <h2 className="font-medium text-lg text-slate-900 mb-4">Your Selection</h2>
              <div className="mb-4">
                <div className="text-sm text-slate-500 font-medium">Airline</div>
                <div className="text-xl font-medium text-slate-900">{airline}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-slate-500 font-medium">Schedule</div>
                <div className="font-medium text-slate-900">{dep} → {arr}</div>
                <div className="text-sm text-slate-500 mt-1">{dur}</div>
              </div>
              <hr className="border-slate-100 my-4" />
              <div className="flex justify-between items-end mb-2">
                <span className="font-medium text-slate-700">Total Price</span>
                <span className="text-2xl font-semibold text-green-600">{price}</span>
              </div>
              <div className="text-xs text-right text-slate-400 mb-6">Includes taxes and fees</div>
              <button
                onClick={continueToPassengers}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2"
              >
                Select Flight <i className="ph-bold ph-arrow-right"></i>
              </button>
            </div>
          </aside>
        </div>
      </main>
      <FlightFooter />
    </>
  );
}
