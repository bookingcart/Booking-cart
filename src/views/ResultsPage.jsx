'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { useBookingState, setBookingState, formatDuration, formatMoney, parseDurationMinutes } from '../hooks/useBookingState.ts';
import { trpc } from '@/lib/trpc';

function FlightCard({ flight, onSelect }) {
  const seg = flight.slices?.[0];
  const seg2 = flight.slices?.[1];
  if (!seg) return null;
  const seg0 = seg.segments?.[0];
  const lastSeg = seg.segments?.[seg.segments.length - 1];
  const stops = (seg.segments?.length ?? 1) - 1;
  const airline = seg0?.marketing_carrier?.name ?? 'Unknown Airline';
  const logoUrl = seg0?.marketing_carrier?.logo_symbol_url;
  const dep = seg0?.departing_at?.slice(11, 16) ?? '--:--';
  const arr = lastSeg?.arriving_at?.slice(11, 16) ?? '--:--';
  const dur = formatDuration(seg.duration ?? 0);
  const price = formatMoney(Number(flight.total_amount), flight.total_currency);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 cursor-pointer" onClick={() => onSelect(flight)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:w-44 shrink-0">
          {logoUrl
            ? <img src={logoUrl} alt={airline} className="w-10 h-10 rounded-lg object-contain border border-slate-100" />
            : <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">{airline.slice(0,2)}</div>}
          <div>
            <div className="font-semibold text-slate-900 text-sm leading-tight">{airline}</div>
            <div className="text-xs text-slate-400">{seg0?.marketing_carrier_flight_number}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-1">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900">{dep}</div>
            <div className="text-xs text-slate-400">{seg0?.origin?.iata_code}</div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-medium text-slate-400">{dur}</div>
            <div className="w-full flex items-center gap-1">
              <div className="h-px flex-1 bg-slate-200"></div>
              {stops > 0 && <div className="text-xs font-bold text-orange-500">{stops} stop{stops > 1 ? 's' : ''}</div>}
              {stops === 0 && <div className="text-xs font-bold text-green-600">Non-stop</div>}
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900">{arr}</div>
            <div className="text-xs text-slate-400">{lastSeg?.destination?.iata_code}</div>
          </div>
        </div>
        {seg2 && (
          <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <i className="ph ph-arrows-clockwise" /> Return
          </div>
        )}
        <div className="sm:text-right shrink-0">
          <div className="text-2xl font-extrabold text-green-600">{price}</div>
          <div className="text-xs text-slate-400 mb-2">per person</div>
          <button
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all"
            onClick={(e) => { e.stopPropagation(); onSelect(flight); }}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { state, hydrated } = useBookingState();
  const s = state.search;

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [maxPrice, setMaxPrice] = useState(2000);
  const [stops, setStops] = useState('any');
  const [airline, setAirline] = useState('any');
  const [departTime, setDepartTime] = useState('any');
  const [sort, setSort] = useState('price');
  const searchFlight = trpc.flights.search.useMutation();

  useEffect(() => { document.title = 'BookingCart — Results'; }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!s?.from || !s?.to || !s?.depart) {
      setLoading(false);
      return;
    }
    search();
  }, [hydrated]);

  async function search() {
    setLoading(true);
    setError('');
    try {
      const data = await searchFlight.mutateAsync({
        originLocationCode: s.from?.match(/\(([A-Z]{3})\)/)?.[1] ?? s.from?.slice(-3),
        destinationLocationCode: s.to?.match(/\(([A-Z]{3})\)/)?.[1] ?? s.to?.slice(-3),
        departureDate: s.depart,
        returnDate: s.tripType === 'round' ? s.return : undefined,
        travelClass: (s.cabin ?? 'economy').toUpperCase(),
        adults: state.passengers?.adults ?? 1,
        children: state.passengers?.children ?? 0,
        infants: state.passengers?.infants ?? 0,
      });
      setFlights(data.offers ?? []);
    } catch (err) {
      setError(err?.message ?? 'No flights found. Try different dates.');
    }
    setLoading(false);
  }

  function selectFlight(flight) {
    setBookingState({ ...state, selectedFlight: flight });
    router.push('/details');
  }

  const airlines = useMemo(() => {
    const names = new Set(flights.map(f => f.slices?.[0]?.segments?.[0]?.marketing_carrier?.name).filter(Boolean));
    return [...names];
  }, [flights]);

  const filtered = useMemo(() => {
    return flights
      .filter(f => Number(f.total_amount) <= maxPrice)
      .filter(f => {
        const n = (f.slices?.[0]?.segments?.length ?? 1) - 1;
        if (stops === '0') return n === 0;
        if (stops === '1') return n <= 1;
        return true;
      })
      .filter(f => airline === 'any' || f.slices?.[0]?.segments?.[0]?.marketing_carrier?.name === airline)
      .filter(f => {
        if (departTime === 'any') return true;
        const dep = f.slices?.[0]?.segments?.[0]?.departing_at;
        if (!dep) return true;
        const h = parseInt(dep.slice(11, 13), 10);
        if (departTime === 'morning') return h >= 5 && h < 12;
        if (departTime === 'afternoon') return h >= 12 && h < 18;
        if (departTime === 'evening') return h >= 18;
        return true;
      })
      .sort((a, b) => {
        if (sort === 'price') return Number(a.total_amount) - Number(b.total_amount);
        if (sort === 'duration') {
          const da = parseDurationMinutes(a.slices?.[0]?.duration ?? 0);
          const db = parseDurationMinutes(b.slices?.[0]?.duration ?? 0);
          return da - db;
        }
        const ta = a.slices?.[0]?.segments?.[0]?.departing_at ?? '';
        const tb = b.slices?.[0]?.segments?.[0]?.departing_at ?? '';
        return ta.localeCompare(tb);
      });
  }, [flights, maxPrice, stops, airline, departTime, sort]);

  const routeLabel = s?.from && s?.to ? `${s.from} — ${s.to}` : '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top row: logo + auth */}
          <div className="h-16 flex items-center justify-between">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-8 w-auto" /></a>
            {/* Desktop: route pill centered */}
            {routeLabel && (
              <div className="hidden sm:flex flex-1 justify-center min-w-0 px-4">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 min-w-0 overflow-hidden max-w-lg">
                  <i className="ph ph-airplane-takeoff text-green-500 text-base shrink-0"></i>
                  <span className="text-sm font-semibold text-slate-700 truncate">{routeLabel}</span>
                  <span className="h-3.5 w-px bg-slate-300 shrink-0"></span>
                  <span className="text-xs text-slate-400 shrink-0">{s?.depart}{s?.return ? ` → ${s.return}` : ''} · {s?.cabin ?? 'Economy'}</span>
                  <a href="/" className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors shrink-0">Modify</a>
                </div>
              </div>
            )}
            <HeaderAuthCluster />
          </div>
          {/* Mobile: route pill below, full width */}
          {routeLabel && (
            <div className="sm:hidden pb-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 w-full">
                <i className="ph ph-airplane-takeoff text-green-500 text-base shrink-0"></i>
                <span className="text-sm font-semibold text-slate-700 truncate flex-1">{routeLabel}</span>
                <span className="h-3.5 w-px bg-slate-300 shrink-0"></span>
                <span className="text-xs text-slate-400 shrink-0">{s?.depart} · {s?.cabin ?? 'Economy'}</span>
                <a href="/" className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors shrink-0">Modify</a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Progress stepper */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar text-sm">
            {[
              { n: 1, label: 'Search', href: '/', done: true },
              { n: 2, label: 'Results', href: '/results', active: true },
              { n: 3, label: 'Details', href: '#' },
              { n: 4, label: 'Passengers', href: '#' },
              { n: 5, label: 'Extras', href: '#' },
              { n: 6, label: 'Payment', href: '#' },
            ].map(({ n, label, href, done, active }, i, arr) => (
              <div key={n} className="flex items-center shrink-0">
                <a
                  href={href}
                  className={`flex items-center gap-2 px-4 py-3.5 font-medium transition-colors whitespace-nowrap border-b-2 ${
                    active
                      ? 'text-green-700 border-green-600'
                      : done
                      ? 'text-slate-500 border-transparent hover:text-slate-700'
                      : 'text-slate-400 border-transparent cursor-default pointer-events-none'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    active ? 'bg-green-600 text-white' : done ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-400'
                  }`}>{n}</span>
                  {label}
                </a>
                {i < arr.length - 1 && <span className="text-slate-200 px-0.5 shrink-0">›</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* Filter bar */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter</span>
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-sm">
              <span className="text-slate-500 text-xs font-medium">Max $</span>
              <input type="range" min={150} max={5000} step={50} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-20 h-1.5 cursor-pointer accent-green-600" />
              <span className="font-bold text-slate-800 text-xs w-14">${maxPrice.toLocaleString()}</span>
            </div>

            <select value={stops} onChange={e => setStops(e.target.value)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
              <option value="any">Any stops</option>
              <option value="0">Non-stop</option>
              <option value="1">1 stop max</option>
            </select>

            <select value={airline} onChange={e => setAirline(e.target.value)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
              <option value="any">Any airline</option>
              {airlines.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select value={departTime} onChange={e => setDepartTime(e.target.value)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
              <option value="any">Any time</option>
              <option value="morning">Morning (05:00–12:00)</option>
              <option value="afternoon">Afternoon (12:00–18:00)</option>
              <option value="evening">Evening (18:00+)</option>
            </select>
          </div>
          <a href="/" className="shrink-0 text-xs font-semibold text-slate-400 hover:text-green-600 transition-colors">Reset</a>
        </div>

        <section className="w-full min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin inline-block"></span> Searching…</span>
              ) : (
                <span>{filtered.length} <span className="font-medium text-slate-500">flight{filtered.length !== 1 ? 's' : ''} found</span></span>
              )}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-semibold text-slate-400" htmlFor="results-sort">Sort by:</label>
              <select id="results-sort" value={sort} onChange={e => setSort(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium">
                <option value="price">Price (Low to High)</option>
                <option value="duration">Duration (Fastest)</option>
                <option value="depart">Departure (Earliest)</option>
              </select>
            </div>
          </div>

          {!s?.from && !loading && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <i className="ph ph-magnifying-glass text-3xl text-amber-500 mb-2 block" />
              <p className="font-medium text-amber-800">No search parameters found.</p>
              <a href="/" className="mt-3 inline-block text-sm font-bold text-green-600 hover:text-green-700">Start a new search →</a>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <i className="ph ph-warning text-3xl text-red-500 mb-2 block" />
              <p className="font-medium text-red-800">{error}</p>
              <button onClick={search} className="mt-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all">Retry</button>
            </div>
          )}

          <div className="space-y-4">
            {loading && [1,2,3].map(n => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/4 mb-4"></div>
                <div className="h-12 bg-slate-100 rounded w-full"></div>
              </div>
            ))}
            {!loading && filtered.map((f, i) => (
              <FlightCard key={f.id ?? i} flight={f} onSelect={selectFlight} />
            ))}
          </div>
        </section>
      </main>
      <FlightFooter />
    </div>
  );
}
