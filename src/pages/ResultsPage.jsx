import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

const SCRIPTS=['/js/loading-ui.js','/js/auth.js','/js/bookingcart.js'];

export default function ResultsPage(){
 useEffect(()=>{document.title='BookingCart — Results';},[]);
 useLegacyScripts(SCRIPTS,'results');
 return (<>
        <main className="flex-grow container mx-auto px-6 py-8" data-results>
      
          
          <div className="flex items-center gap-4 mb-8 overflow-x-auto no-scrollbar steps text-sm font-medium">
            
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-100 whitespace-nowrap"
              data-step-id="search" href="/">
              <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-xs font-medium">1</span>
              Search
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white border border-slate-900 whitespace-nowrap"
              data-step-id="results" href="/results">
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium">2</span>
              Results
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-500 border border-slate-200 whitespace-nowrap"
              data-step-id="details" href="#">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium">3</span>
              Details
            </a>
            <a className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-500 border border-slate-200 whitespace-nowrap"
              data-step-id="passengers" href="#">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium">4</span>
              Passengers
            </a>
          </div>
      
          
          <div className="mb-5 border-b border-slate-200 pb-3" data-results-filters>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0 pr-1">Filter</span>
      
                <details className="relative filter-chip shrink-0">
                  <summary
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 select-none">
                    <span className="text-slate-500">Price</span>
                    <span data-chip-price className="max-w-[5.5rem] truncate font-semibold text-slate-800">—</span>
                    <i className="ph ph-caret-down filter-chip-caret text-xs text-slate-400 transition-transform"></i>
                  </summary>
                  <div
                    className="absolute left-0 top-[calc(100%+8px)] z-40 w-[min(100vw-2rem,18rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                    <label className="mb-2 block text-xs font-medium text-slate-500">Max price</label>
                    <input type="range" name="maxPrice" min="150" max="2000" value="1200"
                      className="mb-2 w-full h-2 cursor-pointer appearance-none rounded-lg bg-slate-100 accent-green-600" />
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>$150</span>
                      <span data-price-max-label>$2000+</span>
                    </div>
                  </div>
                </details>
      
                <details className="relative filter-chip shrink-0">
                  <summary
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 select-none">
                    <span className="text-slate-500">Stops</span>
                    <span data-chip-stops className="max-w-[6rem] truncate font-semibold text-slate-800">Any</span>
                    <i className="ph ph-caret-down filter-chip-caret text-xs text-slate-400 transition-transform"></i>
                  </summary>
                  <div
                    className="absolute left-0 top-[calc(100%+8px)] z-40 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">Stops</label>
                    <select name="stops"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-800 focus:border-green-500 focus:ring-2 focus:ring-green-500">
                      <option value="any">Any number of stops</option>
                      <option value="0">Non-stop only</option>
                      <option value="1">1 stop max</option>
                    </select>
                  </div>
                </details>
      
                <details className="relative filter-chip shrink-0">
                  <summary
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 select-none">
                    <span className="text-slate-500">Airline</span>
                    <span data-chip-airline className="max-w-[6.5rem] truncate font-semibold text-slate-800">Any</span>
                    <i className="ph ph-caret-down filter-chip-caret text-xs text-slate-400 transition-transform"></i>
                  </summary>
                  <div
                    className="absolute left-0 top-[calc(100%+8px)] z-40 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">Airline</label>
                    <select name="airline"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-800 focus:border-green-500 focus:ring-2 focus:ring-green-500">
                      <option value="any">Any airline</option>
                    </select>
                  </div>
                </details>
      
                <details className="relative filter-chip shrink-0">
                  <summary
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 select-none">
                    <span className="text-slate-500">Time</span>
                    <span data-chip-time className="max-w-[5.5rem] truncate font-semibold text-slate-800">Any</span>
                    <i className="ph ph-caret-down filter-chip-caret text-xs text-slate-400 transition-transform"></i>
                  </summary>
                  <div
                    className="absolute right-0 left-auto sm:left-0 sm:right-auto top-[calc(100%+8px)] z-40 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">Departure time</label>
                    <select name="departTime"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-800 focus:border-green-500 focus:ring-2 focus:ring-green-500">
                      <option value="any">Any time</option>
                      <option value="morning">Morning (05:00 - 12:00)</option>
                      <option value="afternoon">Afternoon (12:00 - 18:00)</option>
                      <option value="evening">Evening (18:00 +)</option>
                    </select>
                  </div>
                </details>
              </div>
              <a href="/"
                className="shrink-0 text-xs font-medium text-green-600 hover:text-green-700 sm:ml-2">Reset search</a>
            </div>
          </div>
      
          
          <section className="w-full min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="font-medium text-xl text-slate-900">Best departing flights</h2>
      
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-sm font-semibold text-slate-500 whitespace-nowrap" htmlFor="results-sort">Sort by:</label>
                  <select id="results-sort" name="sort"
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium min-w-[12rem]">
                    <option value="price">Price (Low to High)</option>
                    <option value="duration">Duration (Fastest)</option>
                    <option value="depart">Departure (Earliest)</option>
                  </select>
                </div>
              </div>
      
              <div className="space-y-4" data-results-list>
                
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/4 mb-4"></div>
                  <div className="h-12 bg-slate-100 rounded w-full"></div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/4 mb-4"></div>
                  <div className="h-12 bg-slate-100 rounded w-full"></div>
                </div>
              </div>
          </section>
      
        </main>
<FlightFooter />
</>);
}
