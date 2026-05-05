'use client';
import { useEffect, useState } from 'react';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { trpc } from '@/lib/trpc';

export default function EventsPage() {
  const [location, setLocation] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const utils = trpc.useUtils();
  const { data: statusData } = trpc.events.status.useQuery();

  useEffect(() => { document.title = 'BookingCart — Events'; }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!location.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await utils.events.searchCombined.fetch({ location: location.trim() });
      setEvents(data.events ?? []);
    } catch (err) {
      setError(err?.message ?? 'No events found for that location.');
      setEvents([]);
    }
    setLoading(false);
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50" aria-label="Top navigation">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-500">
              <a href="/" className="hover:text-green-600 transition-colors">Flights</a>
              <a href="/stays" className="hover:text-green-600 transition-colors">Stays</a>
              <a href="/events" className="text-green-600">Events</a>
            </nav>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      <section className="relative min-h-[360px] flex items-center bg-gradient-to-br from-slate-900 to-slate-700 px-6" aria-label="Events search">
        <div className="container mx-auto max-w-4xl relative z-10 py-16">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            Discover events worldwide
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">Find amazing events.</h1>
          <p className="text-slate-300 text-lg mb-8">Search concerts, conferences, workshops, and local experiences — then book tickets instantly.</p>

          <div className="bg-white rounded-2xl p-4 shadow-xl">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="event-location">Location</label>
                  <input
                    id="event-location"
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City or country"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold px-6 h-10 rounded-xl transition-all flex items-center gap-2 text-sm whitespace-nowrap">
                    {loading ? <i className="ph ph-circle-notch animate-spin" /> : <i className="ph ph-magnifying-glass" />}
                    Search events
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-10 max-w-6xl">
        {statusData && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusData.eventbrite ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              <i className={`ph ${statusData.eventbrite ? 'ph-check-circle' : 'ph-x-circle'}`} />
              Eventbrite {statusData.eventbrite ? 'active' : 'unavailable'}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusData.ticketmaster ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              <i className={`ph ${statusData.ticketmaster ? 'ph-check-circle' : 'ph-x-circle'}`} />
              Ticketmaster {statusData.ticketmaster ? 'active' : 'unavailable'}
            </span>
          </div>
        )}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center mb-6">
            <p className="text-amber-800 font-medium">{error}</p>
          </div>
        )}

        {!searched && !loading && (
          <div className="text-center py-16 text-slate-400">
            <i className="ph ph-calendar-blank text-5xl mb-4 block" />
            <p className="font-medium">Search for events in any city to get started.</p>
          </div>
        )}

        {searched && !loading && events.length === 0 && !error && (
          <div className="text-center py-16 text-slate-400">
            <i className="ph ph-calendar-x text-5xl mb-4 block" />
            <p className="font-medium">No events found for "{location}".</p>
          </div>
        )}

        {events.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{events.length} event{events.length !== 1 ? 's' : ''} in {location}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev, i) => (
                <div key={ev.id ?? i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                  {ev.image && (
                    <div className="h-40 overflow-hidden">
                      <img src={ev.image} alt={ev.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">{ev.category ?? 'Event'}</div>
                    <h3 className="font-bold text-slate-900 mb-2 leading-tight">{ev.name}</h3>
                    <div className="text-sm text-slate-500 space-y-1">
                      {ev.date && <div className="flex items-center gap-1.5"><i className="ph ph-calendar" /> {new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                      {ev.venue && <div className="flex items-center gap-1.5"><i className="ph ph-map-pin" /> {ev.venue}</div>}
                      {ev.price && <div className="flex items-center gap-1.5 font-semibold text-green-600"><i className="ph ph-ticket" /> {ev.price}</div>}
                    </div>
                    {ev.url && (
                      <a href={ev.url} target="_blank" rel="noopener noreferrer"
                        className="mt-4 w-full block text-center bg-slate-900 hover:bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl transition-all">
                        View Tickets
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
