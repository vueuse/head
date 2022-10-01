/// <reference types="vitest" />
/// <reference types="vitest/globals" />

import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@vueuse/head': resolve(__dirname),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    reporters: 'dot',
    isolate: true,
  },
})
