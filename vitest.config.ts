/* eslint-disable spaced-comment */
/// <reference types="vitest" />
/// <reference types="vitest/globals" />

import { defineConfig } from "vite"
import { resolve } from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@vueuse/head": resolve(__dirname),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    reporters: "dot",
    isolate: true,
  },
})
