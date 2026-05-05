'use client';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminVisaPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const utils = trpc.useUtils();
  const updateStatusMutation = trpc.visa.updateStatus.useMutation();

  useEffect(() => { document.title = 'Visa Applications | Admin | BookingCart'; }, []);
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await utils.visa.list.fetch({ admin: true });
      setApplications(data.applications ?? []);
    } catch (err) {
      setError(err?.message ?? 'Failed');
    }
    setLoading(false);
  }

  async function updateStatus(id, status, notes) {
    setSaving(true);
    try {
      await updateStatusMutation.mutateAsync({ id, status, notes });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status, notes } : a));
      if (selected?.id === id) setSelected(prev => ({ ...prev, status, notes }));
    } catch (err) {
      setError(err?.message ?? 'Failed to update');
    }
    setSaving(false);
  }

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Visa Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{applications.length} total — {counts.pending} pending</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors">
          <i className="ph ph-arrows-clockwise" /> Refresh
        </button>
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5">
        {[['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === val ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label} <span className="ml-1 opacity-60">{counts[val]}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Table */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400"><i className="ph ph-circle-notch animate-spin text-2xl block mb-2" />Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400"><i className="ph ph-passport text-4xl mb-2 block" /><p>No applications.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['User', 'Passport', 'Destination', 'Submitted', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app, i) => (
                    <tr key={app.id}
                      onClick={() => { setSelected(app); setNotesDraft(app.notes ?? ''); }}
                      className={`border-b border-slate-50 hover:bg-indigo-50 cursor-pointer transition-colors ${selected?.id === app.id ? 'bg-indigo-50' : i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-5 py-3 text-slate-700 text-xs">{app.userEmail ?? '—'}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900 text-sm">{app.passport}</td>
                      <td className="px-5 py-3 text-slate-700">{app.destination}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[app.status] ?? 'bg-slate-100 text-slate-600'}`}>{app.status}</span>
                      </td>
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <select value={app.status} onChange={e => updateStatus(app.id, e.target.value, app.notes)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                          {['pending', 'approved', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">{selected.passport}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <div className="space-y-3 text-sm mb-4">
              <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">User</p><p className="text-slate-700">{selected.userEmail ?? '—'}</p></div>
              <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Destination</p><p className="text-slate-700">{selected.destination}</p></div>
              <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</p><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[selected.status] ?? 'bg-slate-100'}`}>{selected.status}</span></div>
              <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Submitted</p><p className="text-slate-700">{new Date(selected.createdAt).toLocaleString()}</p></div>
            </div>
            <div className="mb-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Admin Notes</label>
              <textarea value={notesDraft} onChange={e => setNotesDraft(e.target.value)} rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" placeholder="Add notes…" />
            </div>
            <div className="flex flex-col gap-2">
              <button disabled={saving} onClick={() => updateStatus(selected.id, 'approved', notesDraft)}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-xl transition-colors">Approve</button>
              <button disabled={saving} onClick={() => updateStatus(selected.id, 'rejected', notesDraft)}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-xl transition-colors">Reject</button>
              <button disabled={saving} onClick={() => updateStatus(selected.id, selected.status, notesDraft)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-xl transition-colors">Save Notes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
