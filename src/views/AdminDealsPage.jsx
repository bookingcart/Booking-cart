'use client';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

const DEST_IMAGES = [
  'https://images.pexels.com/photos/325193/pexels-photo-325193.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'https://images.pexels.com/photos/290386/pexels-photo-290386.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
];

const EMPTY_FORM = {
  id: '',
  origin: '',
  destination: '',
  city: '',
  country: '',
  imageUrl: '',
  active: true,
  sortOrder: 0,
};

export default function AdminDealsPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const utils = trpc.useUtils();
  const upsertMutation = trpc.deals.upsert.useMutation();
  const deleteMutation = trpc.deals.delete.useMutation();
  const toggleMutation = trpc.deals.toggleActive.useMutation();

  useEffect(() => { document.title = 'Flight Deals | Admin | BookingCart'; }, []);
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await utils.deals.listAll.fetch();
      setDeals(data.deals ?? []);
    } catch (err) {
      setError(err?.message ?? 'Failed to load deals');
    }
    setLoading(false);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal('create');
    setError('');
  }

  function openEdit(deal) {
    setForm({
      id: deal.id,
      origin: deal.origin,
      destination: deal.destination,
      city: deal.city,
      country: deal.country,
      imageUrl: deal.imageUrl ?? '',
      active: deal.active,
      sortOrder: deal.sortOrder ?? 0,
    });
    setModal('edit');
    setError('');
  }

  async function handleSave() {
    if (!form.origin || !form.destination || !form.city || !form.country) {
      setError('Origin, destination, city, and country are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await upsertMutation.mutateAsync({
        id: modal === 'edit' ? form.id : undefined,
        origin: form.origin.toUpperCase().trim(),
        destination: form.destination.toUpperCase().trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        imageUrl: form.imageUrl?.trim() || null,
        active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
      });
      await load();
      setModal(null);
    } catch (err) {
      setError(err?.message ?? 'Save failed');
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this deal permanently?')) return;
    setDeleting(id);
    try {
      await deleteMutation.mutateAsync({ id });
      setDeals(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err?.message ?? 'Delete failed');
    }
    setDeleting(null);
  }

  async function handleToggle(deal) {
    try {
      await toggleMutation.mutateAsync({ id: deal.id, active: !deal.active });
      setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, active: !d.active } : d));
    } catch (err) {
      setError(err?.message ?? 'Toggle failed');
    }
  }

  const byOrigin = deals.reduce((acc, d) => {
    if (!acc[d.origin]) acc[d.origin] = [];
    acc[d.origin].push(d);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Flight Deals</h1>
          <p className="text-sm text-slate-500 mt-0.5">{deals.length} deal{deals.length !== 1 ? 's' : ''} — shown on homepage by origin</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors">
            <i className="ph ph-arrows-clockwise" /> Refresh
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm">
            <i className="ph ph-plus" /> Add Deal
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map(n => <div key={n} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="py-24 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <i className="ph ph-tag text-5xl mb-3 block" />
          <p className="font-semibold mb-1">No flight deals yet</p>
          <p className="text-sm mb-4">Deals you add here will appear on the homepage.</p>
          <button onClick={openCreate} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            Add your first deal
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byOrigin).map(([origin, originDeals]) => (
            <div key={origin} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <i className="ph ph-airplane-takeoff text-slate-400" />
                <span className="font-bold text-slate-700 text-sm">Origin: {origin}</span>
                <span className="ml-2 text-xs text-slate-400">{originDeals.length} destination{originDeals.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Preview', 'Destination', 'City', 'Country', 'Sort', 'Active', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 font-bold text-slate-400 uppercase tracking-wider text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {originDeals.map((deal, i) => (
                      <tr key={deal.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                        <td className="px-5 py-3">
                          {deal.imageUrl ? (
                            <img src={deal.imageUrl} alt={deal.city} className="w-16 h-10 object-cover rounded-lg" />
                          ) : (
                            <div className="w-16 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                              <i className="ph ph-image text-slate-400 text-lg" />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-900 text-xs tracking-widest">{deal.destination}</td>
                        <td className="px-5 py-3 text-slate-700">{deal.city}</td>
                        <td className="px-5 py-3 text-slate-500">{deal.country}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs font-mono">{deal.sortOrder}</td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => handleToggle(deal)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${deal.active ? 'bg-green-500' : 'bg-slate-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${deal.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(deal)} className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg border border-blue-200 transition-colors">
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(deal.id)}
                              disabled={deleting === deal.id}
                              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                            >
                              {deleting === deal.id ? '…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{modal === 'create' ? 'Add Flight Deal' : 'Edit Flight Deal'}</h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>

            {error && <p className="text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-4 text-sm">{error}</p>}

            <div className="space-y-4 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Origin (IATA) *</label>
                  <input
                    value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value.toUpperCase() }))}
                    placeholder="e.g. EBB"
                    maxLength={6}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Destination (IATA) *</label>
                  <input
                    value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value.toUpperCase() }))}
                    placeholder="e.g. DXB"
                    maxLength={6}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">City *</label>
                  <input
                    value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Dubai"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Country *</label>
                  <input
                    value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="e.g. UAE"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Image URL</label>
                <input
                  value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://images.pexels.com/…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" className="mt-2 w-full h-24 object-cover rounded-xl border border-slate-200" onError={e => { e.target.style.display = 'none'; }} />
                )}
                <p className="text-[11px] text-slate-400 mt-1">Leave blank to use a fallback image. Tip: use Pexels URLs above.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Sort Order</label>
                  <input
                    type="number" min="0"
                    value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Active</label>
                  <label className="flex items-center gap-3 mt-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                      className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="text-sm font-medium text-slate-700">{form.active ? 'Visible on homepage' : 'Hidden'}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Saving…' : modal === 'create' ? 'Add Deal' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
