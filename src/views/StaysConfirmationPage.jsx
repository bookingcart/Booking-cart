'use client';
import { useEffect, useState } from 'react';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

export default function StaysConfirmationPage() {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    document.title = 'BookingCart — Stay Confirmed!';
    try {
      const stored = localStorage.getItem('bookingcart_stay_v1');
      if (stored) setBooking(JSON.parse(stored));
    } catch {}
  }, []);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
          <HeaderAuthCluster />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-2xl text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <i className="ph-fill ph-check-circle text-4xl text-green-600"></i>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Stay Confirmed!</h1>
        <p className="text-slate-500 font-medium mb-8">Your accommodation has been booked. Check your email for confirmation.</p>
        {booking && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left mb-8">
            <h2 className="font-medium text-lg text-slate-900 mb-4">{booking.stay?.name}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Destination</span><span className="font-semibold">{booking.destination}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Check-in</span><span className="font-semibold">{booking.checkIn}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Check-out</span><span className="font-semibold">{booking.checkOut}</span></div>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <a href="/my-bookings" className="flex-1 bg-slate-900 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-center transition-all">View My Bookings</a>
          <a href="/" className="flex-1 border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-center hover:bg-slate-50 transition-all">Book Another</a>
        </div>
      </main>
    </>
  );
}
