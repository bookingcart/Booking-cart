'use client';
import { useEffect, useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';

const GROUP_LABELS = {
  pricing: 'Pricing',
  contact: 'Contact',
  branding: 'Branding',
  features: 'Features',
  general: 'General',
};

const GROUP_ICONS = {
  pricing: 'ph-currency-dollar',
  contact: 'ph-envelope',
  branding: 'ph-paint-brush',
  features: 'ph-toggle-right',
  general: 'ph-sliders',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState({});
  const [error, setError] = useState('');
  const utils = trpc.useUtils();
  const seedMutation = trpc.settings.seed.useMutation();
  const updateMutation = trpc.settings.update.useMutation();

  useEffect(() => { document.title = 'Settings | Admin | BookingCart'; }, []);
  useEffect(() => { init(); }, []);

  async function init() {
    setLoading(true);
    setError('');
    try {
      // Seed defaults if needed, then load
      await seedMutation.mutateAsync();
      const data = await utils.settings.list.fetch();
      const rows = data.settings ?? [];
      setSettings(rows);
      const vals = {};
      rows.forEach(s => { vals[s.key] = s.value; });
      setValues(vals);
    } catch (err) {
      setError(err?.message ?? 'Failed to load settings');
    }
    setLoading(false);
  }

  async function handleSave(key) {
    setSaving(p => ({ ...p, [key]: true }));
    setSaved(p => ({ ...p, [key]: false }));
    setError('');
    try {
      await updateMutation.mutateAsync({ key, value: values[key] ?? '' });
      setSaved(p => ({ ...p, [key]: true }));
      setTimeout(() => setSaved(p => ({ ...p, [key]: false })), 2000);
    } catch (err) {
      setError(err?.message ?? 'Failed to save');
    }
    setSaving(p => ({ ...p, [key]: false }));
  }

  const grouped = useMemo(() => {
    const acc = {};
    settings.forEach(s => {
      if (!acc[s.group]) acc[s.group] = [];
      acc[s.group].push(s);
    });
    return acc;
  }, [settings]);

  const GROUP_ORDER = ['pricing', 'contact', 'branding', 'features', 'general'];

  function setValue(key, val) {
    setValues(p => ({ ...p, [key]: val }));
    setSaved(p => ({ ...p, [key]: false }));
  }

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Platform Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure site-wide behaviour and content.</p>
        </div>
        <button onClick={init} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors">
          <i className="ph ph-arrows-clockwise" /> Refresh
        </button>
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-6 text-sm">{error}</p>}

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <div className="h-5 bg-slate-100 rounded-lg w-32 animate-pulse" />
              {[1, 2].map(m => <div key={m} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.filter(g => grouped[g]).map(group => (
            <div key={group} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                  <i className={`ph ${GROUP_ICONS[group] ?? 'ph-sliders'} text-slate-500`} />
                </div>
                <h2 className="font-bold text-slate-900">{GROUP_LABELS[group] ?? group}</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {(grouped[group] ?? []).map(setting => (
                  <div key={setting.key} className="flex items-center gap-4 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <label className="text-sm font-semibold text-slate-800 block">{setting.label}</label>
                      <span className="text-[11px] text-slate-400 font-mono">{setting.key}</span>
                    </div>

                    {setting.type === 'boolean' ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setValue(setting.key, values[setting.key] === 'true' ? 'false' : 'true')}
                          className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${values[setting.key] === 'true' ? 'bg-green-500' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${values[setting.key] === 'true' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                        <span className="text-sm text-slate-600 w-16">{values[setting.key] === 'true' ? 'Enabled' : 'Disabled'}</span>
                        <button
                          onClick={() => handleSave(setting.key)}
                          disabled={!!saving[setting.key]}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${saved[setting.key] ? 'bg-green-100 text-green-700' : 'bg-slate-900 hover:bg-slate-700 text-white'} disabled:opacity-50`}
                        >
                          {saving[setting.key] ? 'Saving…' : saved[setting.key] ? '✓ Saved' : 'Save'}
                        </button>
                      </div>
                    ) : setting.type === 'number' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={values[setting.key] ?? ''}
                          onChange={e => setValue(setting.key, e.target.value)}
                          className="w-28 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleSave(setting.key)}
                          disabled={!!saving[setting.key]}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${saved[setting.key] ? 'bg-green-100 text-green-700' : 'bg-slate-900 hover:bg-slate-700 text-white'} disabled:opacity-50`}
                        >
                          {saving[setting.key] ? 'Saving…' : saved[setting.key] ? '✓ Saved' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <input
                          type="text"
                          value={values[setting.key] ?? ''}
                          onChange={e => setValue(setting.key, e.target.value)}
                          className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                          placeholder={`Enter ${setting.label.toLowerCase()}…`}
                        />
                        <button
                          onClick={() => handleSave(setting.key)}
                          disabled={!!saving[setting.key]}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${saved[setting.key] ? 'bg-green-100 text-green-700' : 'bg-slate-900 hover:bg-slate-700 text-white'} disabled:opacity-50`}
                        >
                          {saving[setting.key] ? 'Saving…' : saved[setting.key] ? '✓ Saved' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
