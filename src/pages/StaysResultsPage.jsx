import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

const SCRIPTS = ['/js/loading-ui.js','/js/auth.js','/js/stays.js?v=2'];

export default function StaysResultsPage() {
  useEffect(() => { document.title = 'BookingCart — Stays Results'; }, []);
  useLegacyScripts(SCRIPTS, 'stays-results');
  return (
    <>
      <header className="header" aria-label="Top navigation">
          <div className="container header__inner">
            <a className="brand" href="/" aria-label="BookingCart Home">
              <img src="/images/logo.png" alt="BookingCart" className="brand__logo" style={{"borderRadius":"12px"}} />
            </a>
            <nav className="header__nav" aria-label="Primary">
              <a href="/">Flights</a>
              <a href="/stays">Stays</a>
              <a href="/events">Events</a>
            </nav>
            <HeaderAuthCluster />
          </div>
        </header>
      
        <main className="layout" data-stays-results>
          <div className="container">
            <div className="steps stays-steps" aria-label="Stays steps">
              <a className="step" href="/stays"><span className="step__dot">1</span> Search</a>
              <span className="step" data-active="true"><span className="step__dot">2</span> Results</span>
              <span className="step"><span className="step__dot">3</span> Details</span>
              <span className="step"><span className="step__dot">4</span> Checkout</span>
              <span className="step"><span className="step__dot">5</span> Confirm</span>
            </div>
      
            <div style={{"marginTop":"14px"}}>
              <h1 className="section-title" style={{"fontSize":"24px","margin":0}}><span data-stays-route>â€”</span></h1>
              <div className="muted" style={{"marginTop":"6px","fontWeight":650}} data-stays-meta>â€”</div>
            </div>
      
            <div className="grid-2" style={{"marginTop":"14px"}}>
              <aside className="sidebar" aria-label="Filters">
                <div className="sidebar__header">
                  <div className="sidebar__title">Filters</div>
                  <a className="muted" href="/stays" style={{"fontWeight":800}}>New search</a>
                </div>
                <div className="sidebar__body">
                  <div className="field">
                    <div className="label">Max price / night</div>
                    <input className="control" type="range" name="maxPrice" min="60" max="500" value="450" />
                    <div className="small">Slide to narrow results by nightly price.</div>
                  </div>
      
                  <div className="hr"></div>
      
                  <div className="field">
                    <div className="label">Star rating</div>
                    <div className="checklist">
                      <label className="row" style={{"gap":"10px"}}><input type="checkbox" name="stars" value="5" checked /> <span className="muted">5 stars</span></label>
                      <label className="row" style={{"gap":"10px"}}><input type="checkbox" name="stars" value="4" checked /> <span className="muted">4 stars</span></label>
                      <label className="row" style={{"gap":"10px"}}><input type="checkbox" name="stars" value="3" checked /> <span className="muted">3 stars</span></label>
                    </div>
                  </div>
      
                  <div className="hr"></div>
      
                  <div className="field">
                    <div className="label">Guest rating (min)</div>
                    <input className="control" type="range" name="minRating" min="0" max="10" value="0" step="0.5" />
                    <div className="small">Higher rating = better reviews.</div>
                  </div>
      
                  <div className="hr"></div>
      
                  <div className="field">
                    <div className="label">Amenities</div>
                    <div className="checklist">
                      <label className="row" style={{"gap":"10px"}}><input type="checkbox" name="amenities" value="wifi" /> <span className="muted">Wiâ€‘Fi</span></label>
                      <label className="row" style={{"gap":"10px"}}><input type="checkbox" name="amenities" value="breakfast" /> <span className="muted">Breakfast</span></label>
                      <label className="row" style={{"gap":"10px"}}><input type="checkbox" name="amenities" value="parking" /> <span className="muted">Parking</span></label>
                      <label className="row" style={{"gap":"10px"}}><input type="checkbox" name="amenities" value="pool" /> <span className="muted">Pool</span></label>
                    </div>
                  </div>
      
                  <div className="hr"></div>
      
                  <div className="field">
                    <div className="label">Property type</div>
                    <div className="checklist">
                      <label className="row" style={{"gap":"10px"}}><input type="checkbox" name="type" value="Hotel" checked /> <span className="muted">Hotel</span></label>
                      <label className="row" style={{"gap":"10px"}}><input type="checkbox" name="type" value="Apartment" checked /> <span className="muted">Apartment</span></label>
                      <label className="row" style={{"gap":"10px"}}><input type="checkbox" name="type" value="Lodge" checked /> <span className="muted">Lodge</span></label>
                    </div>
                  </div>
      
                  <div className="hr"></div>
      
                  <div className="field">
                    <div className="label">Sort</div>
                    <select className="control select" name="sort">
                      <option value="popularity">Popularity</option>
                      <option value="price">Price (low to high)</option>
                      <option value="rating">Guest rating</option>
                    </select>
                  </div>
                </div>
              </aside>
      
              <section aria-label="Results">
                <div className="row space" style={{"marginBottom":"10px"}}>
                  <div className="kpi">Available stays</div>
                  <div className="pill">Tip: use filters to narrow down options</div>
                </div>
                <div style={{"display":"grid","gap":"12px"}} data-hotel-list></div>
              </section>
            </div>
          </div>
        </main>
      
        <footer className="bg-white border-t border-slate-100 pt-16 pb-8" aria-label="Footer">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
              <div className="lg:col-span-2 space-y-4">
                <a href="#" className="block text-2xl font-bold text-slate-900 tracking-tight">BookingCart</a>
                <p className="text-slate-500 text-sm">Your Travel, Simplified. Book flights, hotels, and more with confidence and ease.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Navigate</h3>
                <ul className="space-y-3 text-sm text-slate-500 font-medium">
                  <li><a href="/" className="hover:text-green-600 transition-colors">Flights</a></li>
                  <li><a href="/stays" className="hover:text-green-600 transition-colors">Hotels</a></li>
                  <li><a href="/events" className="hover:text-green-600 transition-colors">Events</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-8 text-center text-xs text-slate-400">
              &copy; 2025 BookingCart. All rights reserved.
            </div>
          </div>
        </footer>
    </>
  );
}
