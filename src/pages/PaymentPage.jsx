import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

const SCRIPTS = ['/js/loading-ui.js','/js/auth.js','/js/bookingcart.js'];

export default function PaymentPage() {
  useEffect(() => { document.title = 'BookingCart — Payment'; }, []);
  useLegacyScripts(SCRIPTS, 'payment');
  return (
    <>
        <main className="flex-grow container mx-auto px-6 py-8" data-step="payment">
      
          
          <div className="flex items-center gap-4 mb-8 overflow-x-auto no-scrollbar steps text-sm font-medium">
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-100 whitespace-nowrap"
              data-step-id="search" href="/">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">1</span>
              Search
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-100 whitespace-nowrap"
              data-step-id="results" href="/results">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">2</span>
              Results
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-100 whitespace-nowrap"
              data-step-id="details" href="/details">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">3</span>
              Details
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-100 whitespace-nowrap"
              data-step-id="passengers" href="/passengers">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">4</span>
              Passengers
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-100 whitespace-nowrap"
              data-step-id="extras" href="/extras">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold">5</span>
              Extras
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white border border-slate-900 whitespace-nowrap"
              data-step-id="payment" href="/payment">
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">6</span>
              Payment
            </a>
          </div>
      
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" data-payment>
      
            
            <section className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-slate-900">Payment</h1>
              </div>
              <p className="text-slate-500 font-medium">Choose a secure payment method to pay <span
                  className="font-bold text-slate-900" data-pay-total-inline>â€”</span>.</p>
      
              <form data-payment-form className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                  <i className="ph-duotone ph-shield-check text-green-600 text-xl"></i> Stripe Checkout
                </h2>
                <p className="text-sm text-slate-500 leading-6">
                  BookingCart will redirect you to Stripe's secure hosted checkout page to complete payment.
                  Card details are never entered on this site.
                </p>
      
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Security</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">PCI handled by Stripe</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Booking Ref</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900" data-stripe-booking-ref>—</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Amount</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900" data-stripe-amount>—</div>
                  </div>
                </div>
      
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                    type="submit">
                    Continue to Stripe Checkout <span data-pay-total-btn></span> <i className="ph-bold ph-lock-key"></i>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  You can cancel from Stripe and return here without losing your trip details.
                </p>
              </form>
      
            </section>
      
            
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-24">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg text-slate-900">Total Due</h2>
                </div>
      
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-slate-700">Amount</span>
                  <span className="text-3xl font-extrabold text-green-600" data-pay-total>â€”</span>
                </div>
                <div className="text-xs text-right text-slate-400 mb-6">Secure Transaction</div>
      
                <hr className="border-slate-100 my-4" />
      
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <i className="ph-fill ph-lock-key text-emerald-500 text-lg"></i> SSL Encrypted
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <i className="ph-fill ph-shield-check text-emerald-500 text-lg"></i> Safe Checkout
                  </div>
                </div>
      
              </div>
            </aside>
      
          </div>
        </main>
      <FlightFooter />
    </>
  );
}
