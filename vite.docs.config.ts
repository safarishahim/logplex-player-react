import { defineConfig } from 'vite';

// Builds the documentation/demo site (index.html + example/) into a static
// bundle you can host anywhere — separate from the library build in
// vite.config.ts. Run: `npm run docs:build` → outputs to ./site.
export default defineConfig({
  build: {
    outDir: 'site',
    emptyOutDir: true,
  },
});
