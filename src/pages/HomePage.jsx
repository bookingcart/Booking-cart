import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';
import { FlightFooter } from '../components/FlightFooter.jsx';

const FLIGHT_SCRIPTS = ['/js/loading-ui.js','/js/auth.js','/js/bookingcart.js?v=4','/js/deals.js?v=1'];

export default function HomePage() {
  useEffect(() => { document.title = 'BookingCart — Fly Anywhere'; }, []);
  useLegacyScripts(FLIGHT_SCRIPTS, 'home');

  return (
    <>
      
        <header className="absolute top-0 left-0 w-full z-40 py-6">
          <div className="container mx-auto px-6 flex items-center justify-between">
            
            <div className="flex items-center gap-4">
              <a href="/">
                <img src="/images/logo.png" alt="BookingCart" className="h-10 rounded-xl" />
              </a>
              <button className="lg:hidden text-slate-800">
                <i className="ph ph-list text-2xl"></i>
              </button>
            </div>
      
            
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-500">
              <a href="/" className="text-green-600">Flight Booking</a>
      
            </nav>
      
            
            <div className="flex items-center gap-3">
              
              <div id="g_id_onload" data-client_id=""
                data-context="use" data-ux_mode="popup" data-callback="handleGoogleSignIn" data-auto_prompt="false">
              </div>
      
              <div className="g_id_signin" data-type="standard" data-shape="pill" data-theme="outline" data-text="signin_with"
                data-size="large" data-logo_alignment="left">
              </div>
              
              <div className="relative" data-profile-dropdown>
                <button type="button" data-profile-trigger
                  className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm hover:border-green-500 transition-all focus:ring-2 focus:ring-green-500 outline-none">
                  <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User Profile"
                    className="w-full h-full object-cover" />
                </button>
                
                <div data-profile-menu
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-100 py-2 z-50 hidden">
                  <a href="/account-settings"
                    className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <i className="ph ph-user-circle text-xl text-slate-400"></i> My Account
                  </a>
                  <a href="/my-bookings"
                    className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <i className="ph ph-suitcase-rolling text-xl text-slate-400"></i> Bookings & Trips
                  </a>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button type="button" data-signout
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left">
                    <i className="ph ph-sign-out text-xl"></i> Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      
        
        <section
          className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 min-h-[700px] flex flex-col items-center justify-center text-center px-4"
          data-step="search">
      
          
          <div className="absolute inset-0 z-0 select-none pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/50 to-white/20"></div>
            <img
              src="/images/hero-bg.jpg"
              className="w-full h-full object-cover object-center rounded-b-[40px]"
              alt="Sky background"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2069&auto=format&fit=crop';
              }}
            />
          </div>
      
          
          <div className="relative z-10 max-w-4xl w-full mx-auto">
            <h1 className="text-5xl lg:text-7xl font-semibold text-slate-900 tracking-tight leading-tight mb-4">
              Fly Anywhere
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 font-medium mb-8">
              Affordable Flights, Premium Service.
            </p>
      
      
            
            <div className="mt-6 sm:mt-8 w-full max-w-7xl mx-auto text-left" role="region" aria-label="Search panel">
      
              
              <div className="inline-flex bg-white/60 backdrop-blur rounded-xl p-1 shadow-sm border border-white/80 mb-2 tabs"
                role="tablist">
                <button type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 tab sm:text-sm sm:px-4 sm:py-2 sm:rounded-xl sm:gap-2" role="tab"
                  aria-selected="true" data-trip="round">
                  <i className="ph ph-arrows-left-right text-base"></i> Round Trip
                </button>
                <button type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 tab sm:text-sm sm:px-4 sm:py-2 sm:rounded-xl sm:gap-2" role="tab"
                  aria-selected="false" data-trip="oneway">
                  <i className="ph ph-arrow-right text-base"></i> One-Way Trip
                </button>
      
              </div>
      
              
              <div className="relative z-10 max-w-7xl w-full mx-auto px-0">
                <div className="bg-white rounded-2xl p-1 sm:p-1.5 shadow-lg ring-1 ring-slate-100/80">
                  <form data-search-form
                    className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:grid-rows-[auto_auto] gap-0">
      
                    
                    <div className="min-w-0 sm:min-w-[11rem] lg:min-w-0 px-2 sm:px-3 py-1.5 relative suggest border-b lg:border-b-0 lg:border-r border-slate-100/90 flex flex-row items-center gap-2 lg:col-start-1 lg:row-start-1">
                      <label className="w-9 sm:w-10 shrink-0 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none" htmlFor="search-from">From</label>
                      <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 h-9 sm:h-10">
                        <i className="ph ph-airplane-takeoff text-base text-slate-400 shrink-0" aria-hidden="true"></i>
                        <input id="search-from"
                          className="w-full min-w-0 bg-transparent border-none p-0 text-slate-900 font-semibold placeholder:text-slate-400 text-sm leading-none"
                          name="from" data-airport-input placeholder="City or code" autoComplete="off" />
                      </div>
                      <ul className="suggest__list" role="listbox"></ul>
                    </div>
      
                    
                    <div className="min-w-0 sm:min-w-[11rem] lg:min-w-0 px-2 sm:px-3 py-1.5 relative suggest border-b lg:border-b-0 lg:border-r border-slate-100/90 flex flex-row items-center gap-2 lg:col-start-2 lg:row-start-1">
                      <label className="w-9 sm:w-10 shrink-0 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none" htmlFor="search-to">To</label>
                      <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 h-9 sm:h-10">
                        <i className="ph ph-airplane-landing text-base text-slate-400 shrink-0" aria-hidden="true"></i>
                        <input id="search-to"
                          className="w-full min-w-0 bg-transparent border-none p-0 text-slate-900 font-semibold placeholder:text-slate-400 text-sm leading-none"
                          name="to" data-airport-input placeholder="City or code" autoComplete="off" />
                      </div>
                      <ul className="suggest__list" role="listbox"></ul>
                    </div>
      
                    
                    <div className="min-w-0 w-full px-2 sm:px-3 py-1.5 flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0 border-b lg:border-b-0 lg:border-t border-slate-100/90 lg:col-span-3 lg:row-start-2">
                      <div className="flex-1 min-w-0 field flex flex-row items-center gap-2 sm:pr-2">
                        <span className="w-9 sm:w-10 shrink-0 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none">Out</span>
                        <button type="button" data-cal-trigger="depart"
                          className="flex-1 min-w-0 flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 h-9 sm:h-10 transition-all cursor-pointer text-left">
                          <i className="ph ph-calendar-blank text-base text-slate-400 shrink-0" aria-hidden="true"></i>
                          <span className="text-slate-900 font-semibold text-xs sm:text-sm whitespace-nowrap overflow-x-auto no-scrollbar" data-cal-label="depart">Select</span>
                        </button>
                        <input type="hidden" name="depart" />
                      </div>
                      <div className="hidden sm:block w-px bg-slate-100 self-center" style={{"minHeight":"2rem"}}></div>
                      <div className="flex-1 min-w-0 field group flex flex-row items-center gap-2 sm:pl-2" data-return-field>
                        <span className="w-9 sm:w-10 shrink-0 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none">Back</span>
                        <button type="button" data-cal-trigger="return"
                          className="flex-1 min-w-0 flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 h-9 sm:h-10 transition-all cursor-pointer text-left">
                          <i className="ph ph-calendar-blank text-base text-slate-400 shrink-0" aria-hidden="true"></i>
                          <span className="text-slate-900 font-semibold text-xs sm:text-sm whitespace-nowrap overflow-x-auto no-scrollbar" data-cal-label="return">Select</span>
                        </button>
                        <input type="hidden" name="return" />
                      </div>
                    </div>
      
                    
                    <div className="px-2 sm:px-3 py-1.5 flex flex-row items-center gap-2 lg:gap-2.5 lg:pl-3 lg:pr-1.5 lg:col-start-3 lg:row-start-1">
                      <div className="dropdown relative flex-1 min-w-0 flex flex-row items-center gap-2" data-dropdown>
                        <span className="w-9 sm:w-10 shrink-0 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none">Pax</span>
                        <button className="flex-1 min-w-0 flex items-center gap-1.5 text-left bg-slate-50 rounded-lg px-2 h-9 sm:h-10 control sm:min-w-[6.5rem]" type="button"
                          data-dropdown-trigger data-passengers-trigger>
                          <i className="ph ph-users text-base text-slate-400 shrink-0" aria-hidden="true"></i>
                          <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate" data-passengers-summary>1 traveler</span>
                        </button>
                        <input type="hidden" name="passengers" value="" />
      
                        <div className="dropdown__panel" role="dialog">
                          <div data-passengers className="space-y-4">
                            <div className="flex justify-between items-center counter">
                              <div className="counter__meta">
                                <div className="font-medium text-slate-900">Adults</div>
                                <div className="text-xs text-slate-500">Age 12+</div>
                              </div>
                              <div className="flex items-center gap-3 counter__controls">
                                <button
                                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-green-500 hover:text-green-600 transition-colors"
                                  type="button" data-minus="adults"><i className="ph ph-minus"></i></button>
                                <span className="font-medium w-4 text-center kpi" data-count="adults">1</span>
                                <button
                                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-green-500 hover:text-green-600 transition-colors"
                                  type="button" data-plus="adults"><i className="ph ph-plus"></i></button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center counter">
                              <div className="counter__meta">
                                <div className="font-medium text-slate-900">Children</div>
                                <div className="text-xs text-slate-500">Age 2–11</div>
                              </div>
                              <div className="flex items-center gap-3 counter__controls">
                                <button
                                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-green-500 hover:text-green-600 transition-colors"
                                  type="button" data-minus="children"><i className="ph ph-minus"></i></button>
                                <span className="font-medium w-4 text-center kpi" data-count="children">0</span>
                                <button
                                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-green-500 hover:text-green-600 transition-colors"
                                  type="button" data-plus="children"><i className="ph ph-plus"></i></button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center counter">
                              <div className="counter__meta">
                                <div className="font-medium text-slate-900">Infants</div>
                                <div className="text-xs text-slate-500">Under 2</div>
                              </div>
                              <div className="flex items-center gap-3 counter__controls">
                                <button
                                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-green-500 hover:text-green-600 transition-colors"
                                  type="button" data-minus="infants"><i className="ph ph-minus"></i></button>
                                <span className="font-medium w-4 text-center kpi" data-count="infants">0</span>
                                <button
                                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-green-500 hover:text-green-600 transition-colors"
                                  type="button" data-plus="infants"><i className="ph ph-plus"></i></button>
                              </div>
                            </div>
      
                            <div className="pt-3 mt-1 border-t border-slate-100">
                              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Cabin</label>
                              <select
                                className="w-full bg-slate-50 border-none rounded-lg text-sm font-semibold p-2 focus:ring-2 focus:ring-green-500 control select"
                                name="cabin">
                                <option>Economy</option>
                                <option>Premium</option>
                                <option>Business</option>
                                <option>First</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
      
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold h-9 sm:h-10 px-4 sm:px-5 rounded-lg sm:rounded-xl shadow-md shadow-green-600/25 transition-all flex items-center justify-center gap-1.5 btn btn-primary shrink-0 text-xs sm:text-sm"
                        type="submit">
                        <i className="ph ph-magnifying-glass text-base sm:text-lg"></i>
                        Search
                      </button>
                    </div>
      
                      <div data-multicity style={{"display":"none"}} className="p-2 border-t border-slate-100 lg:col-span-3">
                        <div className="text-sm text-slate-500">Multi-city is a UI preview.</div>
                      </div>
      
                  </form>
      
                  
                  <div id="cal-popup" className="cal-popup" style={{"display":"none"}}>
                    <div className="cal-header">
                      <button type="button" className="cal-nav" data-cal-prev><i className="ph-bold ph-caret-left"></i></button>
                      <span className="cal-title" data-cal-title></span>
                      <button type="button" className="cal-nav" data-cal-next><i className="ph-bold ph-caret-right"></i></button>
                    </div>
                    <div className="cal-weekdays">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                    <div className="cal-grid" data-cal-grid></div>
                  </div>
                </div>
              </div>
      
            </div>
          </div>
        </section>
      
        
        <section id="deals-section" className="max-w-7xl mx-auto px-6 py-16">
      
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <div
                className="inline-flex items-center gap-2 bg-green-50 text-green-700 font-bold text-xs px-3 py-1.5 rounded-full mb-3">
                <i className="ph ph-fire text-base"></i> Personalized for You
              </div>
              <h2 id="deals-title" className="text-3xl font-extrabold text-slate-900">Top Flight Deals</h2>
              <p className="text-slate-500 font-medium mt-1">Real-time prices · Updated every 2 hours</p>
            </div>
      
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <i className="ph ph-map-pin text-green-600"></i>
                <input id="deals-origin-input" type="text" maxLength="3" placeholder="IATA e.g. LHR"
                  className="w-20 bg-transparent font-semibold text-slate-700 uppercase" />
              </div>
              <button id="deals-origin-btn"
                className="bg-slate-900 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-slate-700 transition-all">
                Change
              </button>
            </div>
          </div>
      
          
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
      
              
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Sort:</span>
                <button data-sort="price"
                  className="data-sort px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white transition-all">💰 Lowest
                  Price</button>
                <button data-sort="popular"
                  className="data-sort px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">⭐
                  Popular</button>
                <button data-sort="trending"
                  className="data-sort px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">🔥
                  Trending</button>
              </div>
      
              <div className="hidden lg:block w-px h-8 bg-slate-200 mx-2"></div>
      
              
              <div className="flex items-center gap-4 flex-wrap text-sm">
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Budget:</span>
                  <input id="deals-min-price" type="range" min="0" max="2000" step="50" value="0"
                    className="w-20 accent-green-600" />
                  <input id="deals-max-price" type="range" min="200" max="5000" step="50" value="5000"
                    className="w-20 accent-green-600" />
                  <span id="deals-price-label" className="text-xs font-semibold text-slate-600">$0 – $5000+</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Month:</span>
                  <select id="deals-month"
                    className="bg-slate-50 border-none rounded-lg px-2 py-1 text-xs font-semibold text-slate-700">
                    <option value="">Any</option>
                    <option value="03">Mar</option>
                    <option value="04">Apr</option>
                    <option value="05">May</option>
                    <option value="06">Jun</option>
                    <option value="07">Jul</option>
                    <option value="08">Aug</option>
                    <option value="09">Sep</option>
                    <option value="10">Oct</option>
                    <option value="11">Nov</option>
                    <option value="12">Dec</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input id="deals-direct-only" type="checkbox" className="accent-green-600 w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-600">Direct only</span>
                </label>
              </div>
            </div>
          </div>
      
          
          <div id="deals-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
      
          
          <div className="text-center mt-10">
            <a href="/results"
              className="inline-flex items-center gap-2 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-bold px-8 py-3 rounded-2xl transition-all text-sm">
              <i className="ph ph-magnifying-glass"></i> Search More Flights
            </a>
          </div>
        </section>
      <FlightFooter />
      
    </>

  );
}
