import { useEffect, useRef } from 'react';
import { loadScriptsSequential } from '../legacy/loadScript.js';

/**
 * Loads legacy script URLs in order after mount. Re-runs when key changes (e.g. pathname).
 * @param {string[]} urls
 * @param {string} key
 * @param {(() => void) | undefined} onAllLoaded Runs after all scripts load (e.g. page init). Kept fresh via ref.
 */
export function useLegacyScripts(urls, key = '', onAllLoaded) {
  const onAllLoadedRef = useRef(onAllLoaded);
  onAllLoadedRef.current = onAllLoaded;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScriptsSequential(urls);
        if (!cancelled && typeof window.applyAuthUI === 'function') window.applyAuthUI();
        const cb = onAllLoadedRef.current;
        if (!cancelled && typeof cb === 'function') cb();
      } catch (e) {
        console.warn(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, urls.join('|')]);
}
