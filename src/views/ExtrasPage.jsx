'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { useBookingState, setBookingState, formatMoney } from '../hooks/useBookingState.ts';

const EXTRAS = [
  { id: 'bag23', label: '23kg Checked Bag', price: 45, icon: 'ph-archive-box', desc: 'Per passenger, per leg' },
  { id: 'bag32', label: '32kg Checked Bag', price: 65, icon: 'ph-cube', desc: 'Per passenger, per leg' },
  { id: 'meal', label: 'Meal Selection', price: 18, icon: 'ph-fork-knife', desc: 'Choose your in-flight meal' },
  { id: 'seat', label: 'Seat Selection', price: 22, icon: 'ph-armchair', desc: 'Choose your preferred seat' },
  { id: 'lounge', label: 'Airport Lounge', price: 35, icon: 'ph-couch', desc: 'Access at departure airport' },
  { id: 'fast', label: 'Fast Track Security', price: 15, icon: 'ph-rocket', desc: 'Skip security queues' },
  { id: 'insurance', label: 'Travel Insurance', price: 28, icon: 'ph-shield-check', desc: 'Covers medical, cancellation & delays' },
];

export default function ExtrasPage() {
  const router = useRouter();
  const { state } = useBookingState();
  const [selected, setSelected] = useState({});

  useEffect(() => { document.title = 'BookingCart — Extras'; }, []);

  function toggle(id) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const extrasTotal = EXTRAS.filter(e => selected[e.id]).reduce((sum, e) => sum + e.price, 0);
  const flightPrice = Number(state.selectedFlight?.total_amount ?? 0);
  const currency = state.selectedFlight?.total_currency ?? 'USD';

  function handleContinue() {
    const chosenExtras = EXTRAS.filter(e => selected[e.id]);
    setBookingState({ ...state, extras: chosenExtras, extrasTotal });
    router.push('/payment');
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <div className="hidden lg:flex items-center gap-4">
              <a href="/passengers" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                <i className="ph-bold ph-arrow-left"></i> Back to passengers
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
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white border-slate-900 border whitespace-nowrap" href="/extras">
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">5</span>
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
              <h1 className="text-2xl font-medium text-slate-900">Extras</h1>
              <p className="text-slate-500 font-medium">Enhance your trip with optional add-ons.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EXTRAS.map(extra => (
                <label key={extra.id} className={`relative flex gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${selected[extra.id] ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                  <input type="checkbox" className="sr-only" checked={!!selected[extra.id]} onChange={() => toggle(extra.id)} />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${selected[extra.id] ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                    <i className={`ph ${extra.icon}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{extra.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{extra.desc}</div>
                    <div className="font-bold text-green-600 mt-1">+{formatMoney(extra.price, currency)}</div>
                  </div>
                  {selected[extra.id] && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="ph ph-check text-white text-xs"></i>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </section>

          <aside className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-24">
              <h2 className="font-medium text-lg text-slate-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Flight</span>
                  <span className="font-semibold">{formatMoney(flightPrice, currency)}</span>
                </div>
                {EXTRAS.filter(e => selected[e.id]).map(e => (
                  <div key={e.id} className="flex justify-between text-green-700">
                    <span>{e.label}</span>
                    <span>+{formatMoney(e.price, currency)}</span>
                  </div>
                ))}
              </div>
              <hr className="border-slate-100 my-4" />
              <div className="flex justify-between items-end mb-6">
                <span className="font-medium text-slate-700">Total</span>
                <span className="text-2xl font-semibold text-green-600">{formatMoney(flightPrice + extrasTotal, currency)}</span>
              </div>
              <button onClick={handleContinue}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2">
                Continue to Payment <i className="ph-bold ph-arrow-right"></i>
              </button>
              <button onClick={() => { setBookingState({ ...state, extras: [], extrasTotal: 0 }); router.push('/payment'); }}
                className="w-full mt-2 text-sm text-slate-400 hover:text-slate-600 transition-colors text-center">
                Skip extras
              </button>
            </div>
          </aside>
        </div>
      </main>
      <FlightFooter />
    </>
  );
}
