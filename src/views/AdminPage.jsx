'use client';
import { useEffect, useState } from 'react';
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

const STAT_CARDS = (s) => [
  { label: 'Total Bookings', value: s.total, color: 'text-slate-900', icon: 'ph-airplane-tilt' },
  { label: 'New / Pending', value: s.new, color: 'text-yellow-600', icon: 'ph-clock' },
  { label: 'Confirmed', value: s.confirmed, color: 'text-green-600', icon: 'ph-check-circle' },
  { label: 'Tickets Issued', value: s.issued, color: 'text-purple-600', icon: 'ph-ticket' },
  { label: 'Cancelled', value: s.cancelled, color: 'text-red-600', icon: 'ph-x-circle' },
  { label: 'Revenue', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s.revenue), color: 'text-slate-900', icon: 'ph-currency-dollar' },
  { label: 'Total Users', value: s.users, color: 'text-blue-600', icon: 'ph-users' },
  { label: 'Visa Apps', value: s.visaApps, color: 'text-indigo-600', icon: 'ph-passport' },
];

export default function AdminPage() {
  const { data: bData, isLoading: bLoading, error: bError, refetch: refetchB } = trpc.bookings.list.useQuery();
  const { data: uData, isLoading: uLoading, refetch: refetchU } = trpc.user.list.useQuery();
  const { data: vData, isLoading: vLoading, refetch: refetchV } = trpc.visa.list.useQuery({ admin: true });

  useEffect(() => { document.title = 'Admin — Overview | BookingCart'; }, []);

  const loading = bLoading || uLoading || vLoading;
  const error = bError ? (bError.message ?? 'Failed to load dashboard data') : '';

  const bookings = bData?.bookings ?? [];
  const users = uData?.users ?? [];
  const visaApps = vData?.applications ?? [];

  function loadData() {
    refetchB();
    refetchU();
    refetchV();
  }

  const stats = {
    total: bookings.length,
    new: bookings.filter(b => b.status === 'new' || b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    issued: bookings.filter(b => b.status === 'ticket_issued').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    revenue: bookings.reduce((s, b) => s + Number(b.total ?? 0) / 100, 0),
    users: users.length,
    visaApps: visaApps.length,
  };

  const recentBookings = bookings.slice(0, 6);
  const recentUsers = users.slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back. Here's what's happening.</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors">
          <i className="ph ph-arrows-clockwise" /> Refresh
        </button>
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-6 text-sm">{error}</p>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
        {STAT_CARDS(stats).map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <i className={`ph ${icon} text-base text-slate-400`} />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</span>
            </div>
            <div className={`text-xl font-extrabold ${color}`}>{loading ? '…' : value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent bookings */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Recent Bookings</h2>
            <a href="/admin/bookings" className="text-xs text-green-600 hover:underline font-semibold">View all →</a>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4].map(n => <div key={n} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : recentBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm"><i className="ph ph-airplane-tilt text-3xl mb-2 block" />No bookings yet.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentBookings.map(b => (
                <div key={b.id} className="flex items-center px-6 py-3 gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-900 text-xs tracking-widest">{b.ref}</span>
                    <span className="text-slate-500 text-xs ml-3">{b.route ?? '—'}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: b.currency ?? 'USD' }).format(Number(b.total ?? 0) / 100)}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[b.status] ?? 'bg-slate-100 text-slate-600'}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent users + quick links */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">Recent Users</h2>
              <a href="/admin/users" className="text-xs text-green-600 hover:underline font-semibold">View all →</a>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3].map(n => <div key={n} className="h-9 bg-slate-100 rounded-lg animate-pulse" />)}</div>
            ) : recentUsers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No users yet.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                      {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{u.email}</p>
                    </div>
                    {u.role === 'admin' && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">admin</span>}
                    {u.banned && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">banned</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 grid grid-cols-2 gap-2">
            {[
              { href: '/admin/analytics', icon: 'ph-chart-bar', label: 'Analytics', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
              { href: '/admin/visa', icon: 'ph-passport', label: 'Visa Apps', color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
              { href: '/admin/audit', icon: 'ph-clipboard-text', label: 'Audit Log', color: 'text-slate-600 bg-slate-50 hover:bg-slate-100' },
              { href: '/admin/bookings', icon: 'ph-airplane-tilt', label: 'Bookings', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
            ].map(({ href, icon, label, color }) => (
              <a key={href} href={href} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${color}`}>
                <i className={`ph ${icon} text-xl`} />
                <span className="text-xs font-semibold">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
