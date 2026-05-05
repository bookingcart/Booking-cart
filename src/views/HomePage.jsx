'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { useAirportSearch } from '../hooks/useAirportSearch.ts';
import { setBookingState, formatMoney } from '../hooks/useBookingState.ts';
import { trpc } from '@/lib/trpc';

// ── Airport autocomplete input ──────────────────────────────────────────────
function AirportInput({ id, label, icon, value, onChange }) {
  const search = useAirportSearch();
  const wrapRef = useRef(null);

  useEffect(() => {
    function h(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) search.close(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [search]);

  return (
    <div className="relative" ref={wrapRef}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor={id}>{label}</label>
      <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 h-10 border border-slate-200 focus-within:ring-2 focus-within:ring-green-500 transition">
        <i className={`ph ${icon} text-base text-slate-400 shrink-0`} />
        <input
          id={id} type="text" autoComplete="off" placeholder="City or IATA code"
          value={value}
          onChange={(e) => { onChange(e.target.value); search.handleChange(e.target.value); }}
          className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold placeholder:text-slate-400 text-sm focus:outline-none"
        />
        {search.isLoading && <i className="ph ph-circle-notch animate-spin text-slate-400 text-sm" />}
      </div>
      {search.isOpen && search.suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          {search.suggestions.map((s) => (
            <li key={s.code}>
              <button type="button" className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors"
                onMouseDown={(e) => { e.preventDefault(); onChange(s.label); search.close(); }}>
                <span className="font-semibold text-slate-900 text-sm">{s.city}</span>
                <span className="text-slate-400 text-sm ml-1">({s.code})</span>
                <span className="text-xs text-slate-400 block">{s.name} · {s.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Passenger dropdown ─────────────────────────────────────────────────────
function PassengerDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const total = value.adults + value.children + value.infants;
  function adj(type, delta) {
    onChange({ ...value, [type]: Math.max(type === 'adults' ? 1 : 0, value[type] + delta) });
  }

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Passengers</label>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 h-10 w-full focus:ring-2 focus:ring-green-500 transition text-left">
        <i className="ph ph-users text-base text-slate-400 shrink-0" />
        <span className="font-semibold text-slate-900 text-sm truncate">{total} traveler{total !== 1 ? 's' : ''}</span>
        <i className="ph ph-caret-down text-xs text-slate-400 ml-auto" />
      </button>
      {open && (
        <div className="absolute z-50 left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 space-y-4">
          {['adults', 'children', 'infants'].map((t) => (
            <div key={t} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900 capitalize">{t}</div>
                <div className="text-xs text-slate-400">{t === 'adults' ? 'Age 12+' : t === 'children' ? 'Age 2–11' : 'Under 2'}</div>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => adj(t, -1)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-green-500 hover:text-green-600 transition">
                  <i className="ph ph-minus text-sm" />
                </button>
                <span className="w-4 text-center font-semibold text-slate-900">{value[t]}</span>
                <button type="button" onClick={() => adj(t, 1)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-green-500 hover:text-green-600 transition">
                  <i className="ph ph-plus text-sm" />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setOpen(false)}
            className="w-full bg-slate-900 text-white text-sm font-bold py-2 rounded-xl hover:bg-green-600 transition mt-2">
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ── Deal card ──────────────────────────────────────────────────────────────
const FLAGS = {
  UAE: '🇦🇪', UK: '🇬🇧', Kenya: '🇰🇪', 'South Africa': '🇿🇦',
  Egypt: '🇪🇬', Turkey: '🇹🇷', USA: '🇺🇸', France: '🇫🇷',
  Netherlands: '🇳🇱', Singapore: '🇸🇬', Thailand: '🇹🇭',
  India: '🇮🇳', Uganda: '🇺🇬',
};

function DealCard({ deal }) {
  const router = useRouter();
  const flag = FLAGS[deal.country] ?? '✈️';

  function book() {
    const depart = deal.date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    setBookingState({
      search: { from: `${deal.from} (${deal.from})`, to: `${deal.city} (${deal.to})`, depart, return: '', cabin: 'Economy', tripType: 'oneway' },
      passengers: { adults: 1, children: 0, infants: 0 },
    });
    router.push('/results');
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="relative h-40 overflow-hidden">
        <img src={deal.imageUrl} alt={deal.city}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.currentTarget.src = 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop'; }} />
        {deal.hot && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">🔥 Hot Deal</span>
        )}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-slate-700 text-xs font-bold px-2 py-1 rounded-full">
          {deal.stops === 0 ? 'Non-stop' : `${deal.stops} stop${deal.stops > 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{flag} {deal.city}</h3>
            <p className="text-xs text-slate-500 font-medium">{deal.country}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-extrabold text-green-600">{formatMoney(deal.price, deal.currency)}</div>
            <div className="text-xs text-slate-400">one-way</div>
          </div>
        </div>
        {deal.airline && <p className="text-xs text-slate-400 mb-3">✈ {deal.airline}</p>}
        <button onClick={book} className="w-full bg-slate-900 hover:bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl transition-all">
          Book Now
        </button>
      </div>
    </div>
  );
}

// ── HomePage ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  const [tripType, setTripType] = useState('round');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [depart, setDepart] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [cabin, setCabin] = useState('Economy');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [formError, setFormError] = useState('');

  const [deals, setDeals] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price');
  const [directOnly, setDirectOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [originOverride, setOriginOverride] = useState('');
  const utils = trpc.useUtils();

  useEffect(() => {
    document.title = 'BookingCart — Fly Anywhere';
    fetchDeals();
  }, []);

  async function fetchDeals(origin = '') {
    setDealsLoading(true);
    try {
      const data = await utils.flights.deals.fetch({ origin: origin || undefined });
      if (Array.isArray(data.deals)) setDeals(data.deals);
    } catch {}
    setDealsLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    setFormError('');
    if (!from.trim() || !to.trim()) return setFormError('Please choose departure and destination airports.');
    if (!depart) return setFormError('Please select a departure date.');
    if (tripType === 'round' && !returnDate) return setFormError('Please select a return date or switch to one-way.');
    setBookingState({ search: { from, to, depart, return: returnDate, cabin, tripType }, passengers });
    router.push('/results');
  }

  const displayDeals = [...deals]
    .filter(d => d.price <= maxPrice && (!directOnly || d.stops === 0))
    .sort((a, b) => sortBy === 'price' ? a.price - b.price : (b.hot ? 1 : 0) - (a.hot ? 1 : 0));

  return (
    <>
      <header className="absolute top-0 left-0 w-full z-40 py-6">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="/" className="text-green-600">Flight Booking</a>
          </nav>
          <HeaderAuthCluster />
        </div>
      </header>

      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 min-h-[700px] flex flex-col items-center justify-center text-center px-4">
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/50 to-white/20" />
          <img src="/images/hero-bg.jpg" className="w-full h-full object-cover object-center rounded-b-[40px]" alt="Sky"
            onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2069&auto=format&fit=crop'; }} />
        </div>

        <div className="relative z-10 max-w-4xl w-full mx-auto">
          <h1 className="text-5xl lg:text-7xl font-semibold text-slate-900 tracking-tight leading-tight mb-4">Fly Anywhere</h1>
          <p className="text-lg lg:text-xl text-slate-600 font-medium mb-8">Affordable Flights, Premium Service.</p>

          <div className="mt-6 sm:mt-8 w-full max-w-7xl mx-auto text-left">
            <div className="inline-flex bg-white/60 backdrop-blur rounded-xl p-1 shadow-sm border border-white/80 mb-4" role="tablist">
              {[['round', 'ph-arrows-left-right', 'Round Trip'], ['oneway', 'ph-arrow-right', 'One-Way']].map(([val, icon, lbl]) => (
                <button key={val} type="button" role="tab" aria-selected={tripType === val} onClick={() => setTripType(val)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${tripType === val ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                  <i className={`ph ${icon}`} /> {lbl}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg ring-1 ring-slate-100/80">
              <form onSubmit={handleSearch}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AirportInput id="search-from" label="From" icon="ph-airplane-takeoff" value={from} onChange={setFrom} />
                  <AirportInput id="search-to" label="To" icon="ph-airplane-landing" value={to} onChange={setTo} />
                  <PassengerDropdown value={passengers} onChange={setPassengers} />

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="search-depart">Depart</label>
                    <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 h-10 border border-slate-200 focus-within:ring-2 focus-within:ring-green-500 transition">
                      <i className="ph ph-calendar-blank text-base text-slate-400 shrink-0" />
                      <input id="search-depart" type="date" value={depart} min={today} onChange={e => setDepart(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm focus:outline-none" />
                    </div>
                  </div>

                  {tripType === 'round' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="search-return">Return</label>
                      <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 h-10 border border-slate-200 focus-within:ring-2 focus-within:ring-green-500 transition">
                        <i className="ph ph-calendar-blank text-base text-slate-400 shrink-0" />
                        <input id="search-return" type="date" value={returnDate} min={depart || today} onChange={e => setReturnDate(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm focus:outline-none" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="cabin">Cabin</label>
                    <select id="cabin" value={cabin} onChange={e => setCabin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none">
                      {['Economy', 'Premium', 'Business', 'First'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {formError && (
                  <p className="mt-4 text-sm text-red-600 font-medium bg-red-50 rounded-xl px-4 py-3">{formError}</p>
                )}

                <div className="mt-4 flex justify-end">
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold h-11 px-8 rounded-xl shadow-md shadow-green-600/25 transition-all flex items-center gap-2 text-sm">
                    <i className="ph ph-magnifying-glass text-lg" /> Search Flights
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 font-bold text-xs px-3 py-1.5 rounded-full mb-3">
              <i className="ph ph-fire text-base" /> Personalized for You
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">Top Flight Deals</h2>
            <p className="text-slate-500 font-medium mt-1">Real-time prices · Updated every 2 hours</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
              <i className="ph ph-map-pin text-green-600" />
              <input type="text" maxLength={3} placeholder="IATA e.g. LHR" value={originOverride}
                onChange={e => setOriginOverride(e.target.value.toUpperCase())}
                className="w-20 bg-transparent font-semibold text-slate-700 uppercase focus:outline-none" />
            </div>
            <button onClick={() => fetchDeals(originOverride)}
              className="bg-slate-900 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-slate-700 transition-all">
              Change
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
              {[['price', '💰 Lowest Price'], ['popular', '⭐ Popular']].map(([val, lbl]) => (
                <button key={val} onClick={() => setSortBy(val)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${sortBy === val ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {lbl}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Max:</span>
                <input type="range" min={200} max={5000} step={50} value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))} className="w-24 accent-green-600" />
                <span className="text-xs font-semibold text-slate-600">{formatMoney(maxPrice)}</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={directOnly} onChange={e => setDirectOnly(e.target.checked)} className="accent-green-600 w-4 h-4" />
                <span className="text-xs font-semibold text-slate-600">Direct only</span>
              </label>
            </div>
          </div>
        </div>

        {dealsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
                <div className="h-40 bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-8 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : displayDeals.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <i className="ph ph-airplane text-5xl mb-4 block" />
            <p className="font-medium">No deals matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayDeals.map((deal, i) => <DealCard key={`${deal.to}-${i}`} deal={deal} />)}
          </div>
        )}

        <div className="text-center mt-10">
          <a href="/results" className="inline-flex items-center gap-2 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-bold px-8 py-3 rounded-2xl transition-all text-sm">
            <i className="ph ph-magnifying-glass" /> Search More Flights
          </a>
        </div>
      </section>

      <FlightFooter />
    </>
  );
}
