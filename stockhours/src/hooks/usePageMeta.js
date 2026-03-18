import { useEffect } from 'react';

export function usePageMeta({ title, description, canonical }) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (tag) tag.setAttribute('content', description);
    }

    if (canonical) {
      let tag = document.querySelector('link[rel="canonical"]');
      if (tag) tag.setAttribute('href', canonical);
    }

    return () => {
      document.title = 'TradeBetter — AI Options Trading Journal | Schwab, Webull & thinkorswim';
      const tag = document.querySelector('meta[name="description"]');
      if (tag) tag.setAttribute('content', 'Track, analyze, and improve your options trades with AI coaching. Connect Schwab, Webull, or import from thinkorswim & IBKR. Win rate by setup, pattern detection, and weekly AI reviews.');
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.setAttribute('href', 'https://tradebetter.net/');
    };
  }, [title, description, canonical]);
}
