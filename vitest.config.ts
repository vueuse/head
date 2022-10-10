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
    // note: we can't use a dom environment otherwise the tests will think we're
    // browser based
    globals: true,
    reporters: 'dot',
    isolate: true,
  },
})
