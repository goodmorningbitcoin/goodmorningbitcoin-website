import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser scroll restoration so it doesn't override our scroll-to-top.
    // The browser's history scroll restoration is unreliable in SPAs and frequently
    // restores a stale scroll position on initial load, causing the page to appear
    // scrolled down.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
