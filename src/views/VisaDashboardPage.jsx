'use client';
import { useEffect, useState } from 'react';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { trpc } from '@/lib/trpc';
import { VISA_COUNTRIES } from '@/lib/visa-data';

export default function VisaDashboardPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [passport, setPassport] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading, refetch } = trpc.visa.list.useQuery({});
  const submitMutation = trpc.visa.submit.useMutation({
    onSuccess() {
      setShowForm(false);
      setPassport('');
      setDestination('');
      setNotes('');
      refetch();
    },
  });

  useEffect(() => { document.title = 'Visa Dashboard | BookingCart'; }, []);

  useEffect(() => {
    if (!isLoading) {
      setApplications(data?.applications ?? []);
      setLoading(false);
    }
  }, [data, isLoading]);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Visa Dashboard</h1>
            <p className="text-slate-500 mt-1">Track your visa applications.</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <i className={`ph ${showForm ? 'ph-x' : 'ph-plus'}`} />
            {showForm ? 'Cancel' : 'New Application'}
          </button>
        </div>

        {/* ── New Application Form ── */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-slate-900 mb-4">New Visa Application</h2>
            <form onSubmit={e => { e.preventDefault(); if (passport && destination) submitMutation.mutate({ passport, destination, notes: notes || undefined }); }}>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Passport / Nationality</label>
                  <select value={passport} onChange={e => setPassport(e.target.value)} required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="">Select country</option>
                    {VISA_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Destination Country</label>
                  <select value={destination} onChange={e => setDestination(e.target.value)} required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="">Select country</option>
                    {VISA_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Travel dates, purpose of visit…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
              </div>
              <button type="submit" disabled={submitMutation.isPending || !passport || !destination}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
                {submitMutation.isPending ? <><i className="ph ph-circle-notch animate-spin" /> Submitting…</> : <><i className="ph ph-paper-plane-tilt" /> Submit Application</>}
              </button>
              {submitMutation.isError && <p className="text-red-600 text-xs mt-2">{submitMutation.error?.message}</p>}
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(n => <div key={n} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse h-20" />)}</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <i className="ph ph-passport text-5xl mb-4 block" />
            <h2 className="text-xl font-bold">No applications yet</h2>
            <p className="mb-6">Start a visa check to see requirements.</p>
            <a href="/visa" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all">Check Visa Requirements</a>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app, i) => (
              <div key={app.id ?? i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{app.passport} → {app.destination}</div>
                  <div className="text-sm text-slate-500 mt-1">{new Date(app.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${app.status === 'approved' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {app.status ?? 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
