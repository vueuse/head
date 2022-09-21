import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { resolve } from "pathe"

export default defineConfig({
  resolve: {
    alias: {
      "@vueuse/head": resolve(__dirname, "../../src"),
    },
    dedupe: [
      "vue",
      "@vue/runtime-core",
      "@vue/runtime-dom",
      "@vue/reactivity",
      "@vue/shared",
    ],
  },
  plugins: [vue({})],
})
