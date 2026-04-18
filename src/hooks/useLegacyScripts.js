import { useEffect } from 'react';
import { loadScriptsSequential } from '../legacy/loadScript.js';

/**
 * Loads legacy script URLs in order after mount. Re-runs when key changes (e.g. pathname).
 */
export function useLegacyScripts(urls, key = '') {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScriptsSequential(urls);
        if (!cancelled && typeof window.applyAuthUI === 'function') window.applyAuthUI();
      } catch (e) {
        console.warn(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, urls.join('|')]);
}
