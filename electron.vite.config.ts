import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'mcp-bridge': resolve(__dirname, 'src/mcp-bridge/bridge.ts'),
        },
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          ui: resolve(__dirname, 'src/preload/ui.ts'),
          service: resolve(__dirname, 'src/preload/service.ts'),
        },
      },
    },
  },
  renderer: {
    plugins: [react()],
  },
});
