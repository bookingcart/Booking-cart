'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { useBookingState, setBookingState } from '../hooks/useBookingState.ts';

function PassengerForm({ index, type, value, onChange }) {
  const label = type === 'adult' ? 'Adult' : type === 'child' ? 'Child' : 'Infant';
  const titles = ['Mr', 'Mrs', 'Ms', 'Dr'];

  function change(field, val) {
    onChange({ ...value, [field]: val });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">{index + 1}</span>
        {label} {index + 1}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Title</label>
          <select value={value.title ?? ''} onChange={e => change('title', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none">
            <option value="">Select</option>
            {titles.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">First Name</label>
          <input type="text" value={value.firstName ?? ''} onChange={e => change('firstName', e.target.value)}
            placeholder="Given name"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Last Name</label>
          <input type="text" value={value.lastName ?? ''} onChange={e => change('lastName', e.target.value)}
            placeholder="Family name"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Date of Birth</label>
          <input type="date" value={value.dob ?? ''} onChange={e => change('dob', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nationality</label>
          <input type="text" value={value.nationality ?? ''} onChange={e => change('nationality', e.target.value)}
            placeholder="e.g. British"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Passport / ID</label>
          <input type="text" value={value.passportNumber ?? ''} onChange={e => change('passportNumber', e.target.value)}
            placeholder="Document number"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none" />
        </div>
        {index === 0 && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email (lead passenger)</label>
            <input type="email" value={value.email ?? ''} onChange={e => change('email', e.target.value)}
              placeholder="booking@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PassengersPage() {
  const router = useRouter();
  const { state } = useBookingState();
  const p = state.passengers ?? { adults: 1, children: 0, infants: 0 };

  const types = [
    ...Array(p.adults ?? 1).fill('adult'),
    ...Array(p.children ?? 0).fill('child'),
    ...Array(p.infants ?? 0).fill('infant'),
  ];

  const [details, setDetails] = useState(() =>
    types.map(() => ({ title: '', firstName: '', lastName: '', dob: '', nationality: '', passportNumber: '', email: '' }))
  );
  const [error, setError] = useState('');

  useEffect(() => { document.title = 'BookingCart — Passengers'; }, []);

  function updatePassenger(i, val) {
    setDetails(prev => prev.map((d, j) => j === i ? val : d));
  }

  function handleContinue(e) {
    e.preventDefault();
    setError('');
    const lead = details[0];
    if (!lead.firstName || !lead.lastName || !lead.dob) {
      setError('Please fill in all required fields for the lead passenger.');
      return;
    }
    const contact = {
      name: `${lead.firstName} ${lead.lastName}`.trim(),
      email: lead.email ?? '',
      phone: state.contact?.phone ?? '',
    };
    setBookingState({ ...state, passengerDetails: details, contact });
    router.push('/extras');
  }

  const flight = state.selectedFlight;
  const price = flight ? Number(flight.total_amount) : 0;
  const currency = flight?.total_currency ?? 'USD';

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <div className="hidden lg:flex items-center gap-4">
              <a href="/details" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                <i className="ph-bold ph-arrow-left"></i> Back to details
              </a>
            </div>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8 overflow-x-auto no-scrollbar text-sm font-medium">
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border-green-100 border whitespace-nowrap" href="/">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">1</span>
              Search
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border-green-100 border whitespace-nowrap" href="/results">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">2</span>
              Results
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border-green-100 border whitespace-nowrap" href="/details">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">3</span>
              Details
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white border-slate-900 border whitespace-nowrap" href="/passengers">
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">4</span>
              Passengers
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-500 border-slate-200 border whitespace-nowrap" href="#">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">5</span>
              Extras
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-500 border-slate-200 border whitespace-nowrap" href="#">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">6</span>
              Payment
            </a>
        </div>

        <form onSubmit={handleContinue}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div>
                <h1 className="text-2xl font-medium text-slate-900">Passenger Details</h1>
                <p className="text-slate-500 font-medium">Enter details exactly as they appear on passports/IDs.</p>
              </div>
              {types.map((type, i) => (
                <PassengerForm key={i} index={i} type={type} value={details[i]} onChange={v => updatePassenger(i, v)} />
              ))}
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
            </div>

            <aside className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-24">
                <h2 className="font-medium text-lg text-slate-900 mb-4">Booking Summary</h2>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-slate-500">Route</span><span className="font-semibold">{state.search?.from?.slice(-5)} → {state.search?.to?.slice(-5)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Passengers</span><span className="font-semibold">{types.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Cabin</span><span className="font-semibold">{state.search?.cabin ?? 'Economy'}</span></div>
                </div>
                <hr className="border-slate-100 my-4" />
                <div className="flex justify-between items-end mb-6">
                  <span className="font-medium text-slate-700">Total</span>
                  <span className="text-2xl font-semibold text-green-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)}</span>
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2">
                  Continue to Extras <i className="ph-bold ph-arrow-right"></i>
                </button>
              </div>
            </aside>
          </div>
        </form>
      </main>
      <FlightFooter />
    </>
  );
}
