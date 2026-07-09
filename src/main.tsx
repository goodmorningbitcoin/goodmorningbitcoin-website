// Entry point for both SSG build and client hydration.
// vite-react-ssg handles createRoot/hydrateRoot internally.
import './lib/polyfills.ts';
import './index.css';
import '@fontsource-variable/inter';

// The createRoot export triggers vite-react-ssg's client-side hydration.
// On the server (SSG build), it renders to static HTML.
import './entry.server.tsx';
