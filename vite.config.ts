import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  // SSG — pre-render routes to static HTML at build time
  ssgOptions: {
    entry: path.resolve(__dirname, "src/entry.server.tsx"),
    // flat: /about → /about.html (GitHub Pages friendly)
    dirStyle: 'flat',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    onConsoleLog(log) {
      return !log.includes("React Router Future Flag Warning");
    },
    env: {
      DEBUG_PRINT_LIMIT: '0',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));