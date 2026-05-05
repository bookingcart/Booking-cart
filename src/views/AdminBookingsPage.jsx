'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

const STATUS_COLORS = {
  new: 'bg-amber-100 text-amber-700',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  ticket_issued: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
  completed: 'bg-slate-100 text-slate-600',
};
const STATUSES = ['new', 'pending', 'confirmed', 'ticket_issued', 'completed', 'cancelled', 'refunded'];

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const utils = trpc.useUtils();
  const updateStatus = trpc.bookings.updateStatus.useMutation();

  useEffect(() => { document.title = 'Bookings | Admin | BookingCart'; }, []);
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await utils.bookings.list.fetch();
      setBookings(data.bookings ?? []);
    } catch (err) {
      setError(err?.message ?? 'Failed to load');
    }
    setLoading(false);
  }

  async function updateBookingStatus(id, status) {
    try {
      await updateStatus.mutateAsync({ id, status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch {}
  }

  const filtered = bookings.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (typeFilter !== 'all' && (b.bookingType ?? 'flight') !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (b.ref ?? '').toLowerCase().includes(q) || (b.route ?? '').toLowerCase().includes(q) || (b.contact?.email ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500 mt-0.5">{bookings.length} total</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors">
          <i className="ph ph-arrows-clockwise" /> Refresh
        </button>
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ref, route, email…"
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none w-56"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {['all', ...STATUSES].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {['all', 'flight', 'stay'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${typeFilter === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t === 'all' ? 'All types' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Table */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400"><i className="ph ph-circle-notch animate-spin text-2xl block mb-2" />Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400"><i className="ph ph-airplane-tilt text-4xl mb-2 block" /><p>No bookings found.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Ref', 'Client', 'Route', 'Type', 'Date', 'Total', 'Status', 'Update'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => (
                    <tr key={b.id}
                      onClick={() => router.push(`/admin/bookings/${b.id}`)}
                      className={`border-b border-slate-50 hover:bg-green-50 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-4 py-3 font-bold text-slate-900 tracking-widest text-xs">{b.ref}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-[140px] truncate">{b.contact?.email ?? b.userId ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium text-xs">{b.route ?? '—'}</td>
                      <td className="px-4 py-3 text-xs"><span className={`px-2 py-0.5 rounded-full font-semibold ${(b.bookingType ?? 'flight') === 'stay' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{b.bookingType ?? 'flight'}</span></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{b.dates?.depart ?? b.createdAt ? new Date(b.dates?.depart ?? b.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 text-xs whitespace-nowrap">{new Intl.NumberFormat('en-US', { style: 'currency', currency: b.currency ?? 'USD' }).format(Number(b.total ?? 0) / 100)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[b.status] ?? 'bg-slate-100 text-slate-600'}`}>{b.status}</span></td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select value={b.status} onChange={e => updateBookingStatus(b.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:ring-2 focus:ring-green-500 focus:outline-none">
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
