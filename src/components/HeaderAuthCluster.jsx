import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { HeaderProfileDropdown } from './HeaderProfileDropdown.jsx';

/**
 * Unified Auth Cluster: Handles Google Sign-In button rendering and Profile dropdown.
 */
export function HeaderAuthCluster({ className = '' }) {
  const { user } = useAuth();

  useEffect(() => {
    // Only attempt to boot if we're signed out and Google script is ready
    if (user) return;

    const tryBoot = () => {
      if (typeof window.applyAuthUI === 'function') {
        window.applyAuthUI();
      }
    };

    // If the window is already loaded, boot now. Otherwise wait for load.
    if (document.readyState === 'complete') {
      tryBoot();
    } else {
      window.addEventListener('load', tryBoot);
      return () => window.removeEventListener('load', tryBoot);
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
