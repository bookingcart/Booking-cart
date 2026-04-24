
import { useState, useRef, useEffect } from 'react';

/**
 * BookingCartNavbar
 * Pill-shaped, green-gradient navigation bar.
 * Props:
 *   activeNav  – 'flights' | 'stays' | 'bookings' | 'events'  (highlights the active pill)
 *   rightSlot  – optional JSX rendered on the far right (e.g. Print button)
 */
export default function BookingCartNavbar({ activeNav = 'flights', rightSlot }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!profileRef.current || profileRef.current.contains(e.target)) return;
      setProfileOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const signOut = () => {
    try {
      localStorage.removeItem('bookingcart_user');
      localStorage.removeItem('bookingcart_google_id_token');
      localStorage.removeItem('bc_user');
    } catch (_) {}
    window.location.reload();
  };

  const navItems = [
    { key: 'flights',  href: '/',           icon: 'ph-airplane-tilt',     label: 'Flights'  },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">

        {/* ── outer pill track ── */}
        <div className="flex items-center gap-3">

          {/* ── LEFT: logo capsule ── */}
          <a
            href="/"
            className="shrink-0 flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-shadow group"
          >
            {/* swoosh icon */}
            <span className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center shadow-sm shadow-green-300 group-hover:scale-105 transition-transform">
              <i className="ph ph-airplane-tilt text-white text-sm" />
            </span>

            {/* wordmark */}
            <span className="text-sm font-black tracking-tight leading-none select-none">
              <span className="text-slate-900">BOOKING</span>
              <span className="text-green-600">CART</span>
            </span>
          </a>

          {/* ── MIDDLE: green pill nav ── */}
          <nav
            className="flex-1 flex items-center bg-green-600 rounded-full px-2 py-1.5 gap-1 shadow-lg shadow-green-200/60"
            style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
          >
            {navItems.map(({ key, href, icon, label }) => {
              const isActive = activeNav === key;
              return (
                <a
                  key={key}
                  href={href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 select-none
                    ${isActive
                      ? 'bg-white/20 text-white shadow-inner backdrop-blur-sm'
                      : 'text-green-100 hover:text-white hover:bg-white/15'}
                  `}
                >
                  <i className={`ph ${icon} text-base`} />
                  <span className="hidden sm:inline">{label}</span>
                </a>
              );
            })}
          </nav>

          {/* ── RIGHT: utilities ── */}
          <div className="shrink-0 flex items-center gap-2">

            {/* Currency selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-slate-600 transition-colors">
              <i className="ph ph-globe text-green-600 text-base" />
              <span className="hidden sm:inline">USD</span>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-5 bg-slate-200" />

            {/* Customer support */}
            <a
              href="/support"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <i className="ph ph-headset text-green-600 text-base" />
              <span className="hidden md:inline">Support</span>
            </a>

            {/* Optional slot (e.g. Print button) */}
            {rightSlot}

            {/* Avatar */}
            <div className="relative" ref={profileRef} data-profile-dropdown>
              <button
                id="nav-profile-btn"
                data-header-profile-btn
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileOpen((v) => !v);
                }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center shadow-md shadow-green-200 border-2 border-white hover:scale-105 transition-transform overflow-hidden shrink-0"
                title="My Account"
              >
                <i className="ph ph-user text-white text-base" />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div
                  data-profile-menu
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 py-2 z-50"
                >
                  <a
                    href="/account-settings"
                    className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="ph ph-user-circle text-xl text-slate-400"></i> My Account
                  </a>
                  <a
                    href="/my-bookings"
                    className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="ph ph-suitcase-rolling text-xl text-slate-400"></i> Bookings & Trips
                  </a>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    type="button"
                    data-signout
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      setProfileOpen(false);
                      signOut();
                    }}
                  >
                    <i className="ph ph-sign-out text-xl"></i> Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
