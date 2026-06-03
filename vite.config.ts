import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Library build: bundle our source, keep React + Vidstack external so the
// host app dedupes them. Emits ESM + CJS + .d.ts and a single styles.css.
export default defineConfig({
  plugins: [dts({ rollupTypes: true, include: ['src'] })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LogplexPlayer',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // Keep React, Vidstack (+ its /icons subpath), media-icons, and hls.js
      // external so the host app dedupes them.
      external: (id) => /^(react($|\/)|react-dom($|\/)|@vidstack\/react($|\/)|media-icons($|\/)|hls\.js$)/.test(id),
      output: {
        assetFileNames: (asset) => (asset.name === 'style.css' ? 'styles.css' : asset.name!),
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
    sourcemap: true,
  },
});
