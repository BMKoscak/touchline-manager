import { defineConfig } from 'vite';

// base './' makes the build work from any sub-path (e.g. GitHub Pages /touchline-manager/).
export default defineConfig({
  base: './',
  server: { port: 5173, open: true },
  build: { target: 'es2020', outDir: 'dist', chunkSizeWarningLimit: 1500 },
});
