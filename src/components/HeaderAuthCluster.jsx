import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { HeaderProfileDropdown } from './HeaderProfileDropdown.jsx';

/**
 * Unified Auth Cluster: Handles Google Sign-In button rendering and Profile dropdown.
 */
export function HeaderAuthCluster({ className = '' }) {
  const { user } = useAuth();

  useEffect(() => {
    // If we're already logged in, no need to boot Google button
    if (user) return;

    // Trigger the global bootGoogle function (from /js/auth.js) 
    // to render the button into .g_id_signin if it exists.
    if (typeof window.applyAuthUI === 'function') {
      window.applyAuthUI();
    }
  }, [user]);

  return (
    <div className={`bc-header-auth flex items-center gap-3 flex-shrink-0 ${className}`.trim()}>
      {!user && (
        <div 
          className="g_id_signin" 
          style={{ minWidth: '200px', minHeight: '40px' }}
        ></div>
      )}
      {user && <HeaderProfileDropdown />}
    </div>
  );
}
