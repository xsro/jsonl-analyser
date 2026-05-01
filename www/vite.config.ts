import { defineConfig } from 'vite'

export default defineConfig({
  base: '/jsonl-analyser/',
  build: {
    outDir: 'jsonl-analyser',
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true
  }
})
