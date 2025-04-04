import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2018'
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'js')
    }
  }
});
