'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

export default function StaysDetailsPage() {
  const router = useRouter();
  const [stay, setStay] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    document.title = 'BookingCart — Stay Details';
    try {
      const stored = localStorage.getItem('bookingcart_stay_v1');
      if (stored) {
        const data = JSON.parse(stored);
        setStay(data.stay);
        setBooking(data);
      }
    } catch {}
  }, []);

  if (!stay) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500">No stay selected.</p>
      <a href="/stays" className="text-blue-600 font-semibold hover:underline">← Search stays</a>
    </div>
  );

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <a href="/stays/results" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              <i className="ph-bold ph-arrow-left"></i> Back to results
            </a>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">{stay.name}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {stay.image && <img src={stay.image} alt={stay.name} className="w-full h-64 object-cover rounded-2xl" />}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600"><i className="ph ph-map-pin text-blue-600" /> {stay.location}</div>
              {stay.amenities?.map?.(a => <div key={a} className="flex items-center gap-2 text-slate-600"><i className="ph ph-check-circle text-green-600" /> {a}</div>)}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-24 self-start">
            <h2 className="font-medium text-lg text-slate-900 mb-4">Booking Summary</h2>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between"><span className="text-slate-500">Check-in</span><span className="font-semibold">{booking?.checkIn}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Check-out</span><span className="font-semibold">{booking?.checkOut}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Guests</span><span className="font-semibold">{booking?.guests}</span></div>
            </div>
            <hr className="border-slate-100 my-4" />
            <div className="flex justify-between items-end mb-6">
              <span className="font-medium text-slate-700">Price / night</span>
              <span className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: stay.currency ?? 'USD', maximumFractionDigits: 0 }).format(Number(stay.pricePerNight ?? 0))}
              </span>
            </div>
            <button onClick={() => router.push('/stays/checkout')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
              Continue to Checkout <i className="ph-bold ph-arrow-right"></i>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
