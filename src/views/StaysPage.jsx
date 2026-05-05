'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

export default function StaysPage() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);

  useEffect(() => { document.title = 'BookingCart — Stays'; }, []);

  const today = new Date().toISOString().split('T')[0];

  function handleSearch(e) {
    e.preventDefault();
    if (!destination || !checkIn || !checkOut) return;
    const params = new URLSearchParams({ destination, checkIn, checkOut, rooms: String(rooms), guests: String(guests) });
    router.push('/stays/results?' + params.toString());
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-500">
              <a href="/" className="hover:text-green-600 transition-colors">Flights</a>
              <a href="/stays" className="text-green-600">Stays</a>
              <a href="/events" className="hover:text-green-600 transition-colors">Events</a>
            </nav>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      <section className="relative min-h-[400px] flex items-center bg-gradient-to-br from-blue-900 to-blue-700 px-6">
        <div className="container mx-auto max-w-4xl relative z-10 py-16">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">Find hotels, apartments, and lodges</div>
          <h1 className="text-5xl font-bold text-white mb-3">Book stays with confidence.</h1>
          <p className="text-slate-300 text-lg mb-8">Compare location, amenities, and flexible policies — then checkout fast.</p>

          <div className="bg-white rounded-2xl p-4 shadow-xl">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="stay-dest">Destination</label>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 h-10 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition">
                    <i className="ph ph-map-pin text-base text-slate-400 shrink-0" />
                    <input id="stay-dest" type="text" value={destination} onChange={e => setDestination(e.target.value)}
                      placeholder="City, hotel, or landmark"
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="check-in">Check-in</label>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 h-10 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition">
                    <i className="ph ph-calendar-blank text-base text-slate-400 shrink-0" />
                    <input id="check-in" type="date" value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="check-out">Check-out</label>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 h-10 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition">
                    <i className="ph ph-calendar-blank text-base text-slate-400 shrink-0" />
                    <input id="check-out" type="date" value={checkOut} min={checkIn || today} onChange={e => setCheckOut(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Rooms</label>
                  <select value={rooms} onChange={e => setRooms(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} room{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Guests</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="flex items-end lg:col-span-2">
                  <button type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                    <i className="ph ph-magnifying-glass" /> Search Stays
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="text-center py-16 text-slate-400">
          <i className="ph ph-building text-5xl mb-4 block" />
          <p className="font-medium">Search for stays above to find available properties.</p>
        </div>
      </main>
    </>
  );
}
