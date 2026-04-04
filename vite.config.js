import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Polyfills needed by mainnet-js (Buffer, process, crypto, etc.)
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'util', 'crypto', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    // Ensure global is available for some BCH library internals
    'global': 'globalThis',
  },
  optimizeDeps: {
    // mainnet-js uses internal relative paths that esbuild can't resolve
    // during pre-bundling — exclude it so Vite handles it natively
    exclude: ['mainnet-js'],
  },
})
