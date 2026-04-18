import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { HeaderUserAvatarImg } from './HeaderUserAvatarImg.jsx';

const BTN_CLASS =
  'w-11 h-11 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm hover:border-green-500 transition-all focus:ring-2 focus:ring-green-500 outline-none';

/**
 * Legacy-aligned header profile control: avatar + dropdown (My Account, Bookings & Trips, Sign Out).
 * Uses data-profile-dropdown / data-header-profile-btn / data-profile-menu for public/js/auth.js (applyAuthUI).
 * React handles open state + sign-out so it works across SPA navigations (bookingcart initProfileDropdown only binds once).
 */
export function HeaderProfileDropdown({ triggerClassName = BTN_CLASS }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { refresh } = useAuth();

  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current || rootRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem('bookingcart_user');
      localStorage.removeItem('bookingcart_google_id_token');
      localStorage.removeItem('bc_user');
    } catch (_) {}
    refresh();
    window.location.reload();
  }, [refresh]);

  return (
    <div className="relative" data-profile-dropdown ref={rootRef}>
      <button
        type="button"
        data-header-profile-btn
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <HeaderUserAvatarImg />
      </button>
      <div
        data-profile-menu
        role="menu"
        className={`absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-100 py-2 z-50${open ? '' : ' hidden'}`}
      >
        <a
          href="/account-settings"
          role="menuitem"
          className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          onClick={() => setOpen(false)}
        >
          <i className="ph ph-user-circle text-xl text-slate-400"></i> My Account
        </a>
        <a
          href="/my-bookings"
          role="menuitem"
          className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          onClick={() => setOpen(false)}
        >
          <i className="ph ph-suitcase-rolling text-xl text-slate-400"></i> Bookings & Trips
        </a>
        <div className="border-t border-slate-100 my-1"></div>
        <button
          type="button"
          role="menuitem"
          data-signout
          className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            signOut();
          }}
        >
          <i className="ph ph-sign-out text-xl"></i> Sign Out
        </button>
      </div>
    </div>
  );
}
