import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';

const SCRIPTS = ['/js/loading-ui.js','/js/auth.js','/js/stays.js?v=1'];

export default function StaysDetailsPage() {
  useEffect(() => { document.title = 'BookingCart — Stays Details'; }, []);
  useLegacyScripts(SCRIPTS, 'stays-details');
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
              <a href="/visa">Visa</a>
              <a href="/stays/results">Back to results</a>
            </nav>
          </div>
        </header>
      
        <main className="layout" data-stays-details>
          <div className="container">
            <div className="steps stays-steps" aria-label="Stays steps">
              <a className="step" href="/stays"><span className="step__dot">1</span> Search</a>
              <a className="step" href="/stays/results"><span className="step__dot">2</span> Results</a>
              <span className="step" data-active="true"><span className="step__dot">3</span> Details</span>
              <span className="step"><span className="step__dot">4</span> Checkout</span>
              <span className="step"><span className="step__dot">5</span> Confirm</span>
            </div>
      
            <div className="card" style={{"marginTop":"14px"}}>
              <div className="card__body">
                <div className="row space" style={{"flexWrap":"wrap","gap":"12px"}}>
                  <div>
                    <div className="kpi" style={{"fontSize":"22px"}} data-hotel-name>â€”</div>
                    <div className="small" style={{"marginTop":"4px"}} data-hotel-sub>â€”</div>
                    <div className="muted" style={{"marginTop":"8px"}} data-hotel-address>â€”</div>
                  </div>
                  <div className="rating-badge">
                    <div className="kpi" style={{"fontSize":"16px"}}>Rating</div>
                    <div className="small" data-hotel-rating>â€”</div>
                  </div>
                </div>
      
                <div className="hr"></div>
      
                <div className="gallery" data-hotel-gallery aria-label="Hotel photo gallery"></div>
      
                <div className="hr"></div>
      
                <div className="grid-2" style={{"gridTemplateColumns":"1fr 340px"}}>
                  <section aria-label="Hotel details">
                    <div className="card" style={{"margin":0}}>
                      <div className="card__body">
                        <div className="kpi">Amenities</div>
                        <div className="row" style={{"gap":"8px","flexWrap":"wrap","marginTop":"10px"}} data-hotel-amenities></div>
                      </div>
                    </div>
      
                    <div className="card" style={{"marginTop":"12px"}}>
                      <div className="card__body">
                        <div className="kpi">About this property</div>
                        <div className="muted" style={{"marginTop":"6px"}} data-hotel-desc>â€”</div>
                      </div>
                    </div>
      
                    <div className="card" style={{"marginTop":"12px"}}>
                      <div className="card__body">
                        <div className="kpi">House rules</div>
                        <div className="hr"></div>
                        <div style={{"display":"grid","gap":"10px"}} data-hotel-rules></div>
                      </div>
                    </div>
      
                    <div className="card" style={{"marginTop":"12px"}}>
                      <div className="card__body">
                        <div className="kpi">Policies</div>
                        <div className="hr"></div>
                        <div style={{"display":"grid","gap":"10px"}} data-hotel-policies></div>
                      </div>
                    </div>
      
                    <div className="card" style={{"marginTop":"12px"}}>
                      <div className="card__body">
                        <div className="kpi">Guest reviews</div>
                        <div className="muted" style={{"marginTop":"6px"}}>This UI shows a preview. Connect a reviews API later.</div>
                        <div className="hr"></div>
                        <div className="row" style={{"gap":"8px","flexWrap":"wrap"}}>
                          <span className="pill">Clean rooms</span>
                          <span className="pill">Great location</span>
                          <span className="pill">Friendly staff</span>
                          <span className="pill">Fast Wiâ€‘Fi</span>
                        </div>
                      </div>
                    </div>
                  </section>
      
                  <aside className="sidebar" aria-label="Map">
                    <div className="card" style={{"margin":0}}>
                      <div className="card__body">
                        <div className="kpi">Map</div>
                        <div className="muted" style={{"marginTop":"6px"}}>Preview</div>
                        <div style={{"marginTop":"10px"}} data-map></div>
                      </div>
                    </div>
                  </aside>
                </div>
      
                <div className="card" style={{"marginTop":"12px"}}>
                  <div className="card__body">
                    <div className="row space" style={{"flexWrap":"wrap"}}>
                      <div>
                        <div className="kpi">Room types</div>
                        <div className="muted" style={{"marginTop":"6px"}}>Select a room to continue to checkout.</div>
                      </div>
                      <a className="muted" href="/stays/results" style={{"fontWeight":800}}>Change property</a>
                    </div>
                    <div className="hr"></div>
                    <div style={{"display":"grid","gap":"12px"}} data-room-list></div>
                  </div>
                </div>
              </div>
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
