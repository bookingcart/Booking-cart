import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';
import { FlightFooter } from '../components/FlightFooter.jsx';

const SCRIPTS = ['/js/loading-ui.js','/js/auth.js','/js/bookingcart.js'];

export default function DetailsPage() {
  useEffect(() => { document.title = 'BookingCart — Details'; }, []);
  useLegacyScripts(SCRIPTS, 'details');
  return (
    <>
      
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <a href="/" className="text-2xl font-semibold text-slate-900 tracking-tight"><img src="images/logo.png" alt="BookingCart" className="h-10 rounded-xl" /></a>
              <div className="hidden lg:flex items-center gap-4">
                <a href="/results"
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                  <i className="ph-bold ph-arrow-left"></i> Back to results
                </a>
              </div>
            </div>
      
                  
            <div className="flex items-center gap-3">
              
              <div id="g_id_onload"
                   data-client_id=""
                   data-context="use"
                   data-ux_mode="popup"
                   data-callback="handleGoogleSignIn"
                   data-auto_prompt="false">
              </div>
              
              <div className="g_id_signin"
                   data-type="standard"
                   data-shape="pill"
                   data-theme="outline"
                   data-text="signin_with"
                   data-size="large"
                   data-logo_alignment="left">
              </div>
              
              <button type="button" data-header-profile-btn
                className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm hover:border-green-500 transition-all focus:ring-2 focus:ring-green-500 outline-none">
                <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User Profile" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        </header>
      
        
        <main className="flex-grow container mx-auto px-6 py-8" data-step="details">
      
          
          <div className="flex items-center gap-4 mb-8 overflow-x-auto no-scrollbar steps text-sm font-medium">
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-100 whitespace-nowrap"
              data-step-id="search" href="/">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-medium">1</span>
              Search
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-100 whitespace-nowrap"
              data-step-id="results" href="/results">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-medium">2</span>
              Results
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white border border-slate-900 whitespace-nowrap"
              data-step-id="details" href="#">
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium">3</span>
              Details
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-500 border border-slate-200 whitespace-nowrap"
              data-step-id="passengers" href="#">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium">4</span>
              Passengers
            </a>
          </div>
      
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" data-details>
      
            
            
      
            <section className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-medium text-slate-900">Flight Details</h1>
              </div>
              <p className="text-slate-500 font-medium">Review the full breakdown, fare rules, and baggage allowances.</p>
      
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" id="flight-segments-container">
                <h2 className="font-medium text-lg text-slate-900 mb-4 flex items-center gap-2"><i
                    className="ph-duotone ph-airplane-tilt text-green-600 text-xl"></i> Trip Breakdown</h2>
                <hr className="border-slate-100 my-4" />
                <div className="text-sm text-slate-500 py-4 flex justify-center items-center"><i
                    className="ph-bold ph-spinner-gap animate-spin mr-2"></i> Loading flight details...</div>
              </div>
      
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-medium text-lg text-slate-900 mb-4 flex items-center gap-2"><i
                    className="ph-duotone ph-receipt text-green-600 text-xl"></i> Fare Rules</h2>
                <p className="text-sm text-slate-500 mb-4">Typical rules for this fare class.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-medium text-slate-700 text-sm">Refund Policy</span>
                    <span className="text-sm font-semibold text-slate-500">Refundable with fee</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-medium text-slate-700 text-sm">Changes</span>
                    <span className="text-sm font-semibold text-slate-500">Allowed (fare difference applies)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-medium text-slate-700 text-sm">No-show</span>
                    <span className="text-sm font-semibold text-slate-500">Ticket forfeited</span>
                  </div>
                </div>
              </div>
      
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-medium text-lg text-slate-900 mb-4 flex items-center gap-2"><i
                    className="ph-duotone ph-suitcase text-green-600 text-xl"></i> Baggage</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 text-center">
                    <i className="ph-fill ph-bag text-2xl text-slate-400 mb-2"></i>
                    <div className="font-medium text-slate-900 text-sm">Personal Item</div>
                    <div className="text-xs text-slate-500">Included</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 text-center">
                    <i className="ph-fill ph-suitcase-rolling text-2xl text-slate-400 mb-2"></i>
                    <div className="font-medium text-slate-900 text-sm">Carry-on</div>
                    <div className="text-xs text-slate-500">7kg Included</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 text-center border border-dashed border-slate-300">
                    <i className="ph-fill ph-archive-box text-2xl text-slate-300 mb-2"></i>
                    <div className="font-medium text-slate-900 text-sm">Checked Bag</div>
                    <div className="text-xs text-slate-500">0-1 (Varies)</div>
                  </div>
                </div>
              </div>
      
            </section>
      
            
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-24">
                <h2 className="font-medium text-lg text-slate-900 mb-4">Your Selection</h2>
      
                <div className="mb-4">
                  <div className="text-sm text-slate-500 font-medium">Airline</div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm"
                      data-airline-logo>
                      <div className="w-full h-full flex items-center justify-center text-slate-900 font-medium">â€”</div>
                    </div>
                    <div className="text-xl font-medium text-slate-900" data-airline>â€”</div>
                  </div>
                </div>
      
                <div className="mb-4">
                  <div className="text-sm text-slate-500 font-medium">Schedule</div>
                  <div className="font-medium text-slate-900" data-times>â€”</div>
                  <div className="text-sm text-slate-500 mt-1" data-duration>â€”</div>
                </div>
      
                <hr className="border-slate-100 my-4" />
      
                <div className="flex justify-between items-end mb-2">
                  <span className="font-medium text-slate-700">Total Price</span>
                  <span className="text-2xl font-semibold text-green-600" data-price>â€”</span>
                </div>
                <div className="text-xs text-right text-slate-400 mb-6">Includes taxes and fees</div>
      
                <button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2"
                  data-select-flight>
                  Select Flight <i className="ph-bold ph-arrow-right"></i>
                </button>
              </div>
            </aside>
      
          </div>
        </main>
      <FlightFooter />
    </>
  );
}
