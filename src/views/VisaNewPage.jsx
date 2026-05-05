'use client';
import { useEffect, useRef, useState } from 'react';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { getVisaDetails, getVisaRequirement, COUNTRY_TO_ISO2, VISA_COUNTRIES } from '@/lib/visa-data';

export default function VisaNewPage() {
  const [passport, setPassport] = useState('');
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = 'Visa Tool | BookingCart'; }, []);

  async function handleCheck(e) {
    e.preventDefault();
    if (!passport || !destination) return;
    setLoading(true);
    setResult(null);
    // Use local dataset — no network call needed
    setTimeout(() => {
      const pIso2 = COUNTRY_TO_ISO2[passport];
      const dIso2 = COUNTRY_TO_ISO2[destination];
      if (!pIso2 || !dIso2) {
        setResult({ ok: false, error: 'Unknown country. Please select from the list.' });
      } else {
        const visaType = getVisaRequirement(pIso2, dIso2);
        setResult({ ok: true, visaType, pIso2, dIso2 });
      }
      setLoading(false);
    }, 200);
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-500">
              <a href="/" className="hover:text-green-600">Flights</a>
              <a href="/visa" className="text-green-600">Visa Tool</a>
            </nav>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      <section className="relative min-h-[360px] flex items-center bg-gradient-to-br from-indigo-900 to-indigo-700 px-6">
        <div className="container mx-auto max-w-3xl relative z-10 py-16">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">Visa Requirements</div>
          <h1 className="text-5xl font-bold text-white mb-3">Check Visa Requirements</h1>
          <p className="text-indigo-300 text-lg mb-8">Instantly check if you need a visa, and what type.</p>

          <div className="bg-white rounded-2xl p-4 shadow-xl">
            <form onSubmit={handleCheck}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="passport">Passport / Nationality</label>
                  <select id="passport" value={passport} onChange={e => setPassport(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="">Select country</option>
                    {VISA_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="dest-country">Destination</label>
                  <select id="dest-country" value={destination} onChange={e => setDestination(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="">Select country</option>
                    {VISA_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold h-10 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                    {loading ? <i className="ph ph-circle-notch animate-spin" /> : <i className="ph ph-magnifying-glass" />} Check Visa
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-10 max-w-3xl">
        {result && (
          <div className={`rounded-2xl border p-6 ${result.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {result.ok ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><i className="ph-fill ph-check-circle text-2xl text-green-600"></i></div>
                  <div>
                    <div className="font-bold text-green-800 text-lg">{result.visaType ?? 'Visa required'}</div>
                    <div className="text-green-700 text-sm">{passport} → {destination}</div>
                  </div>
                </div>
                {result.details && <p className="text-sm text-green-700 mb-4">{result.details}</p>}
                {(() => { const det = getVisaDetails(result.pIso2 ?? COUNTRY_TO_ISO2[passport] ?? passport, result.dIso2 ?? COUNTRY_TO_ISO2[destination] ?? destination, result.visaType); return det ? (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {det.stayDuration && <div className="bg-white rounded-xl border border-green-100 px-3 py-2"><div className="text-slate-400 mb-0.5">Max Stay</div><div className="font-bold text-slate-800">{det.stayDuration}</div></div>}
                    {det.passportValidity && <div className="bg-white rounded-xl border border-green-100 px-3 py-2"><div className="text-slate-400 mb-0.5">Passport Validity</div><div className="font-bold text-slate-800">{det.passportValidity}</div></div>}
                    {det.processingTime && <div className="bg-white rounded-xl border border-green-100 px-3 py-2"><div className="text-slate-400 mb-0.5">Processing Time</div><div className="font-bold text-slate-800">{det.processingTime}</div></div>}
                    <div className="bg-white rounded-xl border border-green-100 px-3 py-2"><div className="text-slate-400 mb-0.5">Fee</div><div className="font-bold text-slate-800">{det.fee === 0 ? 'Free' : det.fee}</div></div>
                    <div className="bg-white rounded-xl border border-green-100 px-3 py-2"><div className="text-slate-400 mb-0.5">Return Ticket</div><div className="font-bold text-slate-800">{det.returnTicket ? 'Required' : 'Not required'}</div></div>
                    <div className="bg-white rounded-xl border border-green-100 px-3 py-2"><div className="text-slate-400 mb-0.5">Proof of Funds</div><div className="font-bold text-slate-800">{det.proofOfFunds ? 'Required' : 'Not required'}</div></div>
                    {det.healthRequirements?.length > 0 && <div className="col-span-2 sm:col-span-3 bg-white rounded-xl border border-green-100 px-3 py-2"><div className="text-slate-400 mb-1">Health Requirements</div><div className="flex flex-wrap gap-1">{det.healthRequirements.map(h => <span key={h} className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">{h}</span>)}</div></div>}
                    {det.notes && <div className="col-span-2 sm:col-span-3 bg-white rounded-xl border border-green-100 px-3 py-2"><div className="text-slate-400 mb-0.5">Notes</div><div className="font-medium text-slate-700">{det.notes}</div></div>}
                  </div>
                ) : null; })()}
              </>
            ) : (
              <p className="text-red-800 font-medium">{result.error ?? 'Could not determine visa requirements.'}</p>
            )}
          </div>
        )}
        {!result && !loading && (
          <div className="text-center py-16 text-slate-400">
            <i className="ph ph-passport text-5xl mb-4 block" />
            <p className="font-medium">Select your passport and destination to check visa requirements.</p>
          </div>
        )}
      </main>
    </>
  );
}
