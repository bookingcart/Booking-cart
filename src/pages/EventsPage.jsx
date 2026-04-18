import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

const SCRIPTS = ['/js/loading-ui.js','/js/auth.js','/js/events.js?v=2'];

export default function EventsPage() {
  useEffect(() => { document.title = 'BookingCart — Events'; }, []);
  useLegacyScripts(SCRIPTS, 'events');
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
      
        <section className="hero" aria-label="Events search">
          <div className="hero__bg" aria-hidden="true"></div>
          <div className="container hero__content" data-events-search>
            <div className="badge">Discover events worldwide</div>
            <h1 className="h1">Find amazing events.</h1>
            <p className="lead">Search concerts, conferences, workshops, and local experiences â€” then book tickets instantly.</p>
      
            <div className="panel" role="region" aria-label="Search events panel">
              <div className="panel__inner">
                <form data-events-form>
                  <div className="form-grid form-grid--events">
                    <div className="field suggest" data-span="2">
                      <div className="label">Location</div>
                      <input className="control" name="location" placeholder="City or country" autoComplete="off" required />
                    </div>
      
                    <div className="field field--submit">
                      <div className="label">&nbsp;</div>
                      <button className="btn btn-primary" type="submit">Search events</button>
                    </div>
                  </div>
                </form>
      
                <div data-events-status style={{"display":"none","marginTop":"12px"}}></div>
              </div>
            </div>
          </div>
        </section>
      
        <section className="layout" aria-label="Events results" data-events-results-section style={{"display":"none"}}>
          <div className="container">
            <div className="section">
              <div className="section__head">
                <div>
                  <div className="kpi" style={{"fontSize":"18px"}}>Events</div>
                  <div className="muted" style={{"marginTop":"6px"}}>Live events from Eventbrite and Ticketmaster.</div>
                </div>
              </div>
              <div className="events-grid" data-events-results></div>
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
