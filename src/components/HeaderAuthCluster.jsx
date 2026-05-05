import { HeaderProfileDropdown } from './HeaderProfileDropdown.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Auth cluster: shows Sign In / Sign Up links when logged out,
 * or the profile dropdown when signed in.
 */
export function HeaderAuthCluster({ className = '' }) {
  const { user, isPending } = useAuth();

  if (isPending) return null;

  return (
    <div className={`bc-header-auth flex items-center gap-3 flex-shrink-0 ${className}`.trim()}>
      {user ? (
        <HeaderProfileDropdown />
      ) : (
        <>
          <a
            href="/sign-in"
            className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/sign-up"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
          >
            Sign Up
          </a>
        </>
      )}
    </div>
  );
}
