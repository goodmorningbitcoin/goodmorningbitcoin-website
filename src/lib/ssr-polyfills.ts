/**
 * SSR-safe polyfills for vite-react-ssg build.
 *
 * MUST be imported as the very first import in entry.server.tsx.
 * ESM imports are hoisted and execute in order — this ensures
 * window/localStorage/document are defined BEFORE any other module
 * (e.g. @remix-run/router) caches a reference to them.
 */
const g = globalThis as Record<string, unknown>;

if (!g.localStorage) {
  const store = new Map<string, string>();
  g.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
}

if (!g.sessionStorage) {
  g.sessionStorage = g.localStorage;
}

if (!g.window) {
  const win = {
    localStorage: g.localStorage,
    sessionStorage: g.sessionStorage,
    matchMedia: () => ({
      matches: false, media: '', onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1024,
    innerHeight: 768,
    location: { href: 'http://localhost:8080', pathname: '/', search: '', hash: '', hostname: 'localhost', port: '8080', protocol: 'http:', origin: 'http://localhost:8080' },
    navigator: { userAgent: 'node' },
    history: {
      pushState: () => {}, replaceState: () => {}, go: () => {},
      back: () => {}, forward: () => {}, length: 1, state: null,
      scrollRestoration: 'auto',
    },
  };
  g.window = win;
  // Also set on global scope so bare `window` references resolve
  (g as Record<string, unknown>).window = win;
}

if (!g.document) {
  const doc = {
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {}, innerHTML: '', tagName: '' }),
    createTextNode: () => ({ textContent: '' }),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { appendChild: () => {}, insertBefore: () => {}, removeChild: () => {} },
    head: { appendChild: () => {}, removeChild: () => {} },
    readyState: 'complete',
    documentElement: { setAttribute: () => {}, getAttribute: () => null, clientWidth: 1024 },
    cookie: '',
    title: '',
  };
  g.document = doc;
  (g as Record<string, unknown>).document = doc;
}

if (!g.matchMedia) {
  g.matchMedia = (g.window as Record<string, unknown>).matchMedia;
}
