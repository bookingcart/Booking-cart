import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

const SCRIPTS = ['/js/loading-ui.js','/js/auth.js','/js/bookingcart.js'];

export default function ExtrasPage() {
  useEffect(() => { document.title = 'BookingCart — Extras'; }, []);
  useLegacyScripts(SCRIPTS, 'extras');
  return (
    <>
      
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <a href="/" className="text-2xl font-extrabold text-slate-900 tracking-tight"><img src="images/logo.png" alt="BookingCart" className="h-10 rounded-xl" /></a>
              <div className="hidden lg:flex items-center gap-4">
                <a href="/passengers"
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                  <i className="ph-bold ph-arrow-left"></i> Back to passengers
                </a>
              </div>
            </div>
      
                  
            <div className="flex items-center gap-3">
              
              <HeaderAuthCluster />
            </div>
          </div>
        </header>
      
        
        <main className="flex-grow container mx-auto px-6 py-8" data-step="extras">
      
          
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
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white border border-slate-900 whitespace-nowrap"
              data-step-id="extras" href="/extras">
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">5</span>
              Extras
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-500 border border-slate-200 whitespace-nowrap"
              data-step-id="payment" href="#">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">6</span>
              Payment
            </a>
          </div>
      
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" data-extras>
      
            
            <section className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-slate-900">Add-ons & Extras</h1>
              </div>
              <p className="text-slate-500 font-medium">Customize your trip with baggage, seats, and more.</p>
      
              <form data-extras-form className="space-y-6">
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2"><i
                      className="ph-duotone ph-suitcase-rolling text-green-600 text-xl"></i> Extra Baggage</h2>
                  <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Checked Bag (23kg)</div>
                      <div className="text-xs text-slate-500 mt-1">Add per bag</div>
                    </div>
                    <input
                      className="w-20 bg-white border border-slate-200 rounded-lg p-2 text-center font-bold focus:ring-2 focus:ring-green-500 outline-none"
                      type="number" name="baggage" min="0" max="6" value="0" />
                  </div>
                </div>
      
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2"><i
                      className="ph-duotone ph-armchair text-green-600 text-xl"></i> Seat Selection</h2>
                  <div className="space-y-3">
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none"
                      name="seat">
                      <option value="none">No specific seat preference</option>
                      <option value="standard">Standard Aisle/Window</option>
                      <option value="extra">Extra Legroom</option>
                    </select>
                  </div>
                </div>
      
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2"><i
                      className="ph-duotone ph-shield-check text-green-600 text-xl"></i> Travel Insurance</h2>
                  <label
                    className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" name="insurance"
                      className="w-6 h-6 text-green-600 rounded focus:ring-green-500 border-gray-300" />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Add Trip Protection</div>
                      <div className="text-xs text-slate-500">Covers cancellations and medical emergencies.</div>
                    </div>
                  </label>
                </div>
      
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2"><i
                      className="ph-duotone ph-fork-knife text-green-600 text-xl"></i> Meal Preference</h2>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none"
                    name="meal">
                    <option value="none">No meal preference</option>
                    <option value="standard">Standard Meal</option>
                    <option value="premium">Premium Meal</option>
                    <option value="veg">Vegetarian</option>
                  </select>
                </div>
      
                <div className="flex justify-end pt-4">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                    type="submit">
                    Continue to Payment <i className="ph-bold ph-arrow-right"></i>
                  </button>
                </div>
              </form>
            </section>
      
            
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-24">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg text-slate-900">Price Summary</h2>
                </div>
      
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Base Fare</span>
                    <span className="font-bold text-slate-900" data-sum-base>â€”</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Extras</span>
                    <span className="font-bold text-slate-900" data-sum-extras>â€”</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Taxes & Fees</span>
                    <span className="font-bold text-slate-900" data-sum-taxes>â€”</span>
                  </div>
                </div>
      
                <hr className="border-slate-100 my-4" />
      
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-slate-700">Total Due</span>
                  <span className="text-2xl font-extrabold text-green-600" data-sum-total>â€”</span>
                </div>
                <div className="text-xs text-right text-slate-400">Updates automatically</div>
      
              </div>
            </aside>
      
          </div>
        </main>
      <FlightFooter />
    </>
  );
}
