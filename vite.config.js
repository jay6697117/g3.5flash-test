import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/');

          if (
            normalizedId.includes('/node_modules/three/') &&
            !normalizedId.includes('/node_modules/three/examples/')
          ) {
            return 'vendor-three';
          }
        },
      },
    },
  },
});
