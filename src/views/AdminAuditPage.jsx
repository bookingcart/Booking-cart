'use client';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

const ACTION_COLORS = {
  'booking.status_update': 'bg-blue-100 text-blue-700',
  'booking.cancel': 'bg-orange-100 text-orange-700',
  'booking.delete': 'bg-red-100 text-red-700',
  'user.ban': 'bg-red-100 text-red-700',
  'user.unban': 'bg-green-100 text-green-700',
  'user.setRole': 'bg-purple-100 text-purple-700',
  'visa.status_update': 'bg-indigo-100 text-indigo-700',
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');
  const LIMIT = 50;
  const utils = trpc.useUtils();

  useEffect(() => { document.title = 'Audit Log | Admin | BookingCart'; }, []);
  useEffect(() => { load(0, true); }, []);

  async function load(off = 0, reset = false) {
    setLoading(true);
    setError('');
    try {
      const data = await utils.audit.list.fetch({ limit: LIMIT, offset: off });
      setLogs(prev => reset ? data.logs : [...prev, ...data.logs]);
      setHasMore(data.logs.length === LIMIT);
      setOffset(off + data.logs.length);
    } catch (err) {
      setError(err?.message ?? 'Failed to load audit log');
    }
    setLoading(false);
  }

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">All admin actions, chronologically</p>
        </div>
        <button onClick={() => load(0, true)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors">
          <i className="ph ph-arrows-clockwise" /> Refresh
        </button>
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400"><i className="ph ph-circle-notch animate-spin text-2xl block mb-2" />Loading…</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400"><i className="ph ph-clipboard-text text-4xl mb-2 block" /><p>No audit entries yet.</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['When', 'Admin', 'Action', 'Target', 'Details'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <>
                      <tr key={log.id}
                        className={`border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                        <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          <p className="font-semibold text-slate-800">{log.adminName ?? '—'}</p>
                          <p className="text-slate-400">{log.adminEmail ?? ''}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'}`}>{log.action}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-600 text-xs font-mono">{log.targetId ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-400 text-xs">
                          <button className="flex items-center gap-1 hover:text-slate-600">
                            <i className={`ph ${expanded === log.id ? 'ph-caret-up' : 'ph-caret-down'}`} /> JSON
                          </button>
                        </td>
                      </tr>
                      {expanded === log.id && (
                        <tr key={`${log.id}-detail`} className="border-b border-slate-100 bg-slate-50">
                          <td colSpan={5} className="px-5 py-3">
                            <pre className="text-xs text-slate-700 bg-white border border-slate-100 rounded-xl p-3 overflow-auto max-h-40 font-mono">
                              {JSON.stringify(log.event, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div className="px-5 py-4 border-t border-slate-100 text-center">
                <button onClick={() => load(offset)} disabled={loading}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-6 py-2 rounded-xl transition-colors disabled:opacity-50">
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
