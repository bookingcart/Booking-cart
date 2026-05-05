'use client';
import { useEffect, useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function BarChart({ data, valueKey, labelKey, colorClass = 'bg-green-500', formatValue }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="space-y-2">
      {data.map((row, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-16 shrink-0 text-right">{row[labelKey]}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full ${colorClass} transition-all duration-500`}
              style={{ width: `${(row[valueKey] / max) * 100}%`, minWidth: row[valueKey] > 0 ? '4px' : '0' }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 w-20 shrink-0">{formatValue ? formatValue(row[valueKey]) : row[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { data, isLoading: loading, error: queryError } = trpc.bookings.list.useQuery();
  const bookings = data?.bookings ?? [];
  const error = queryError?.message ?? '';

  useEffect(() => { document.title = 'Analytics | Admin | BookingCart'; }, []);

  const analytics = useMemo(() => {
    if (!bookings.length) return null;

    const fmt = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

    // Revenue & bookings by month (last 12 months)
    const monthMap = {};
    bookings.forEach(b => {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { label: `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`, revenue: 0, count: 0 };
      monthMap[key].revenue += Number(b.total ?? 0) / 100;
      monthMap[key].count++;
    });
    const revenueByMonth = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, v]) => v);

    // By status
    const statusMap = {};
    bookings.forEach(b => { statusMap[b.status] = (statusMap[b.status] ?? 0) + 1; });
    const byStatus = Object.entries(statusMap).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

    // Top routes
    const routeMap = {};
    bookings.forEach(b => {
      const r = b.route ?? 'Unknown';
      if (!routeMap[r]) routeMap[r] = { label: r, count: 0, revenue: 0 };
      routeMap[r].count++;
      routeMap[r].revenue += Number(b.total ?? 0) / 100;
    });
    const topRoutes = Object.values(routeMap).sort((a, b) => b.count - a.count).slice(0, 10);

    // Type split
    const flights = bookings.filter(b => (b.bookingType ?? 'flight') === 'flight').length;
    const stays = bookings.filter(b => b.bookingType === 'stay').length;

    // Totals
    const totalRevenue = bookings.reduce((s, b) => s + Number(b.total ?? 0) / 100, 0);
    const avgOrder = bookings.length ? totalRevenue / bookings.length : 0;

    return { revenueByMonth, byStatus, topRoutes, flights, stays, totalRevenue, avgOrder, fmt };
  }, [bookings]);

  if (loading) return (
    <div className="p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2,3,4].map(n => <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 h-64 animate-pulse" />)}
      </div>
    </div>
  );

  if (error) return <div className="p-6 lg:p-8"><p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">{error}</p></div>;

  if (!analytics) return (
    <div className="p-6 lg:p-8 text-center py-24 text-slate-400">
      <i className="ph ph-chart-bar text-5xl mb-3 block" />
      <p>No booking data yet.</p>
    </div>
  );

  const { revenueByMonth, byStatus, topRoutes, flights, stays, totalRevenue, avgOrder, fmt } = analytics;

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Based on {bookings.length} total bookings</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: fmt(totalRevenue), icon: 'ph-currency-dollar', color: 'text-green-600' },
          { label: 'Avg. Order Value', value: fmt(avgOrder), icon: 'ph-trend-up', color: 'text-blue-600' },
          { label: 'Total Flights', value: flights, icon: 'ph-airplane-tilt', color: 'text-slate-900' },
          { label: 'Total Stays', value: stays, icon: 'ph-house', color: 'text-purple-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <i className={`ph ${icon} text-slate-400 text-base`} />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-xl font-extrabold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by month */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">Revenue by Month</h2>
          {revenueByMonth.length === 0 ? <p className="text-slate-400 text-sm">No data.</p> : (
            <BarChart data={revenueByMonth} valueKey="revenue" labelKey="label" colorClass="bg-green-500" formatValue={fmt} />
          )}
        </div>

        {/* Bookings by month */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">Bookings by Month</h2>
          {revenueByMonth.length === 0 ? <p className="text-slate-400 text-sm">No data.</p> : (
            <BarChart data={revenueByMonth} valueKey="count" labelKey="label" colorClass="bg-blue-500" />
          )}
        </div>

        {/* Top routes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">Top Routes</h2>
          {topRoutes.length === 0 ? <p className="text-slate-400 text-sm">No data.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Route</th>
                  <th className="text-right py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Bookings</th>
                  <th className="text-right py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue</th>
                </tr></thead>
                <tbody>
                  {topRoutes.map((r, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 font-medium text-slate-800">{r.label}</td>
                      <td className="py-2 text-right text-slate-600 font-semibold">{r.count}</td>
                      <td className="py-2 text-right font-bold text-slate-900">{fmt(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">Booking Status Breakdown</h2>
          {byStatus.length === 0 ? <p className="text-slate-400 text-sm">No data.</p> : (
            <div className="space-y-3">
              <BarChart data={byStatus} valueKey="count" labelKey="label" colorClass="bg-purple-500" />
              {/* Type split */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Type Split</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden flex">
                    {flights + stays > 0 && (
                      <>
                        <div className="bg-green-500 h-5 transition-all" style={{ width: `${(flights / (flights + stays)) * 100}%` }} title={`Flights: ${flights}`} />
                        <div className="bg-blue-500 h-5 transition-all" style={{ width: `${(stays / (flights + stays)) * 100}%` }} title={`Stays: ${stays}`} />
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Flights {flights}</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />Stays {stays}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
