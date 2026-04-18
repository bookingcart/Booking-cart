import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';

const SCRIPTS = ['/js/loading-ui.js','/js/auth.js','/js/stays.js?v=2'];

export default function StaysPage() {
  useEffect(() => { document.title = 'BookingCart — Stays'; }, []);
  useLegacyScripts(SCRIPTS, 'stays');
  return (
    <>
      <header className="header" aria-label="Top navigation">
          <div className="container header__inner">
            <a className="brand" href="/" aria-label="BookingCart Home">
              <img src="images/logo.png" alt="BookingCart" className="brand__logo" style={{"borderRadius":"12px"}} />
            </a>
            <nav className="header__nav" aria-label="Primary">
              <a href="/">Flights</a>
              <a href="/stays">Stays</a>
              <a href="/events">Events</a>
            </nav>
          </div>
        </header>
      
        <section className="hero" aria-label="Stays search">
          <div className="hero__bg" aria-hidden="true"></div>
          <div className="container hero__content" data-stays-search>
            <div className="badge">Find hotels, apartments, and lodges</div>
            <h1 className="h1">Book stays with confidence.</h1>
            <p className="lead">Compare location, amenities, and flexible policies â€” then checkout in a fast, secure flow.</p>
      
            <div className="panel" role="region" aria-label="Search stays panel">
              <div className="panel__inner">
                <form data-stays-form>
                  <div className="form-grid form-grid--stays">
                    <div className="field suggest" data-span="2">
                      <div className="label">Destination</div>
                      <input className="control" name="destination" data-dest-input placeholder="City, hotel, or landmark" autoComplete="off" />
                      <ul className="suggest__list" data-dest-list role="listbox" aria-label="Destination suggestions"></ul>
                    </div>
      
                    <div className="field">
                      <div className="label">Check-in</div>
                      <input className="control" name="checkIn" type="date" />
                    </div>
      
                    <div className="field">
                      <div className="label">Check-out</div>
                      <input className="control" name="checkOut" type="date" />
                    </div>
      
                    <div className="field">
                      <div className="label">Guests</div>
                      <div className="guests" data-guests>
                        <button className="control" type="button" data-guests-trigger style={{"textAlign":"left"}}>2 adults â€¢ 0 children â€¢ 1 room</button>
                        <div className="guests__panel" data-guests-panel role="dialog" aria-label="Guests selector">
                          <div style={{"display":"grid","gap":"10px"}}>
                            <div className="counter">
                              <div className="counter__meta">
                                <div className="counter__title">Adults</div>
                                <div className="counter__hint">Age 18+</div>
                              </div>
                              <div className="counter__controls">
                                <button className="icon-btn" type="button" data-minus="adults" aria-label="Decrease adults">âˆ’</button>
                                <span className="kpi" data-count="adults">2</span>
                                <button className="icon-btn" type="button" data-plus="adults" aria-label="Increase adults">+</button>
                              </div>
                            </div>
      
                            <div className="counter">
                              <div className="counter__meta">
                                <div className="counter__title">Children</div>
                                <div className="counter__hint">Age 0â€“17</div>
                              </div>
                              <div className="counter__controls">
                                <button className="icon-btn" type="button" data-minus="children" aria-label="Decrease children">âˆ’</button>
                                <span className="kpi" data-count="children">0</span>
                                <button className="icon-btn" type="button" data-plus="children" aria-label="Increase children">+</button>
                              </div>
                            </div>
      
                            <div className="counter">
                              <div className="counter__meta">
                                <div className="counter__title">Rooms</div>
                                <div className="counter__hint">How many rooms?</div>
                              </div>
                              <div className="counter__controls">
                                <button className="icon-btn" type="button" data-minus="rooms" aria-label="Decrease rooms">âˆ’</button>
                                <span className="kpi" data-count="rooms">1</span>
                                <button className="icon-btn" type="button" data-plus="rooms" aria-label="Increase rooms">+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
      
                    <div className="field field--submit">
                      <div className="label">&nbsp;</div>
                      <button className="btn btn-primary" type="submit">Search stays</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
      
            <div className="steps stays-steps" aria-label="Stays steps">
              <span className="step" data-active="true"><span className="step__dot">1</span> Search</span>
              <span className="step"><span className="step__dot">2</span> Results</span>
              <span className="step"><span className="step__dot">3</span> Details</span>
              <span className="step"><span className="step__dot">4</span> Checkout</span>
              <span className="step"><span className="step__dot">5</span> Confirm</span>
            </div>
          </div>
        </section>
      
        <section className="layout" aria-label="Stays suggestions" data-stays-suggestions>
          <div className="container">
            <div className="section">
              <div className="section__head">
                <div>
                  <div className="kpi" style={{"fontSize":"18px"}}>Top booked</div>
                  <div className="muted" style={{"marginTop":"6px"}}>Popular picks right now. Tap to open details or start your search.</div>
                </div>
              </div>
              <div className="suggest-grid" data-top-booked></div>
            </div>
      
            <div className="section" style={{"marginTop":"18px"}}>
              <div className="section__head">
                <div>
                  <div className="kpi" style={{"fontSize":"18px"}}>Top locations</div>
                  <div className="muted" style={{"marginTop":"6px"}}>Trending destinations with great availability and flexible policies.</div>
                </div>
              </div>
              <div className="suggest-grid" data-top-locations></div>
            </div>
          </div>
        </section>
      
        
        <footer className="bg-white border-t border-slate-100 pt-16 pb-8" aria-label="Footer">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
              
              <div className="lg:col-span-2 space-y-4">
                <a href="#" className="block text-2xl font-bold text-slate-900 tracking-tight">BookingCart</a>
                <p className="text-slate-500 text-sm">Your Travel, Simplified. Book flights, hotels, and more with confidence and
                  ease.</p>
                <div className="flex gap-4 pt-2">
                  <a href="#"
                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors"><i
                      className="ph-fill ph-facebook-logo"></i></a>
                  <a href="#"
                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors"><i
                      className="ph-fill ph-x-logo"></i></a>
                  <a href="#"
                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors"><i
                      className="ph-fill ph-instagram-logo"></i></a>
                  <a href="#"
                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors"><i
                      className="ph-fill ph-linkedin-logo"></i></a>
                </div>
              </div>
      
              
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Navigate</h3>
                <ul className="space-y-3 text-sm text-slate-500 font-medium">
                  <li><a href="/" className="hover:text-green-600 transition-colors">Flights</a></li>
                  <li><a href="#" className="hover:text-green-600 transition-colors">Hotels</a></li>
                  <li><a href="#" className="hover:text-green-600 transition-colors">Trains</a></li>
                </ul>
              </div>
      
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Company</h3>
                <ul className="space-y-3 text-sm text-slate-500 font-medium">
                  <li><a href="#" className="hover:text-green-600 transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-green-600 transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-green-600 transition-colors">Blog</a></li>
                </ul>
              </div>
      
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Support</h3>
                <ul className="space-y-3 text-sm text-slate-500 font-medium">
                  <li><a href="#" className="hover:text-green-600 transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-green-600 transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-green-600 transition-colors">FAQ</a></li>
                </ul>
              </div>
      
              
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Reviews</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex text-yellow-400 text-sm mb-1">â˜…â˜…â˜…â˜…â˜…</div>
                  <div className="font-bold text-slate-900">4.8 out of 5</div>
                  <div className="text-xs text-slate-400 mt-1">Based on 12,847 reviews</div>
                </div>
              </div>
            </div>
      
            <div
              className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
              <div>&copy; 2026 BookingCart. All rights reserved.</div>
              <div className="flex gap-6">
                <a href="/privacy" className="hover:text-slate-600">Privacy Policy</a>
                <a href="/terms" className="hover:text-slate-600">Terms of Service</a>
                <a href="#" className="hover:text-slate-600">Cookie Setting</a>
              </div>
            </div>
          </div>
        </footer>
    </>
  );
}
