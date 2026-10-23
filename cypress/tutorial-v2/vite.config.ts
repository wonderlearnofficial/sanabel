import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { entries: ['cypress/tutorial-v2/index.html'] },
  resolve: { alias: [{ find: /^.*context\/StudentUserProvider$/, replacement: resolve('cypress/tutorial-v2/userFixture.ts') }] },
  server: { host: '127.0.0.1', port: 5187, strictPort: true },
});
