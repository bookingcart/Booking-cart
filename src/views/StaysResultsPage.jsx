'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

export default function StaysResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const destination = searchParams.get('destination') ?? '';
  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const guests = searchParams.get('guests') ?? '2';

  useEffect(() => { document.title = 'BookingCart — Stays Results'; }, []);

  useEffect(() => {
    if (!destination) { setLoading(false); return; }
    fetch(`/api/stays/search?destination=${encodeURIComponent(destination)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setResults(d.results ?? []); else setError(d.error ?? 'No results'); })
      .catch(() => setError('Search failed'))
      .finally(() => setLoading(false));
  }, []);

  function selectStay(stay) {
    localStorage.setItem('bookingcart_stay_v1', JSON.stringify({ stay, checkIn, checkOut, guests, destination }));
    router.push('/stays/details');
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <div className="hidden lg:flex items-center gap-4">
              <a href="/stays" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                <i className="ph-bold ph-arrow-left"></i> Modify search
              </a>
            </div>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      <div className="flex items-center gap-4 container mx-auto px-6 py-4 text-sm font-medium overflow-x-auto no-scrollbar">
        {[['1', 'Search', '/stays'], ['2', 'Results', '/stays/results'], ['3', 'Details', '#'], ['4', 'Checkout', '#']].map(([n, label, href], i) => {
          const isActive = label === 'Results';
          const isPast = i < 1;
          const cls = isActive ? 'bg-slate-900 text-white border-slate-900' : isPast ? 'bg-green-50 text-green-700 border-green-100' : 'bg-white text-slate-500 border-slate-200';
          const numCls = isActive ? 'bg-slate-700' : isPast ? 'bg-green-200' : 'bg-slate-100';
          return <a key={label} href={isPast || isActive ? href : '#'} className={`flex items-center gap-2 px-4 py-2 rounded-full ${cls} border whitespace-nowrap`}>
            <span className={`w-5 h-5 rounded-full ${numCls} flex items-center justify-center text-xs font-bold`}>{n}</span>{label}</a>;
        })}
      </div>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {loading ? 'Searching…' : `${results.length} stays in ${destination}`}
        </h1>

        {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6"><p className="text-red-800 font-medium">{error}</p></div>}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-100" />
                <div className="p-4 space-y-2"><div className="h-4 bg-slate-100 rounded w-3/4" /><div className="h-4 bg-slate-100 rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="text-center py-16 text-slate-400">
            <i className="ph ph-building text-5xl mb-4 block" />
            <p className="font-medium">No stays found.</p>
            <a href="/stays" className="mt-3 inline-block text-sm font-bold text-blue-600 hover:text-blue-700">Try a different search →</a>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((stay, i) => (
            <div key={stay.id ?? i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer" onClick={() => selectStay(stay)}>
              {stay.image && <div className="h-48 overflow-hidden"><img src={stay.image} alt={stay.name} className="w-full h-full object-cover" /></div>}
              <div className="p-5">
                <h3 className="font-bold text-slate-900 mb-1">{stay.name}</h3>
                <div className="text-sm text-slate-500 mb-3 flex items-center gap-1"><i className="ph ph-map-pin" /> {stay.location}</div>
                {stay.rating && <div className="flex items-center gap-1 text-sm mb-3 text-yellow-500">{'★'.repeat(Math.round(stay.rating))}<span className="text-slate-500 ml-1">{stay.rating}/5</span></div>}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-blue-600">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: stay.currency ?? 'USD', maximumFractionDigits: 0 }).format(Number(stay.pricePerNight ?? 0))}
                    </div>
                    <div className="text-xs text-slate-400">per night</div>
                  </div>
                  <button className="bg-slate-900 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all" onClick={e => { e.stopPropagation(); selectStay(stay); }}>Select</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
