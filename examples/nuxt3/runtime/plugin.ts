import { createHead, renderHeadToString } from "@vueuse/head"
import {
  computed,
  ref,
  watchEffect,
  onBeforeUnmount,
  getCurrentInstance,
  ComputedGetter,
} from "vue"
import defu from "defu"
import type { MetaObject } from "."
import { defineNuxtPlugin, useRoute } from "#app"
import { useRouter, watch } from "#imports"

// Note: This is just a copy of Nuxt's internal head plugin with modifications made for this issue

export default defineNuxtPlugin((nuxtApp) => {
  const head = createHead()

  nuxtApp.vueApp.use(head)

  const headReady = ref(false)
  nuxtApp.hooks.hookOnce("app:mounted", () => {
    watchEffect(() => {
      head.updateDOM()
    })
    headReady.value = true
  })

  if (process.client) {
    head._pauseDOMUpdates.value = true
    nuxtApp.hooks.hookOnce("page:finish", () => {
      head._pauseDOMUpdates.value = false
      // start pausing DOM updates when route changes (trigger immediately)
      useRouter().beforeEach(() => {
        head._pauseDOMUpdates.value = true
      })

      // watch for new route before unpausing dom updates (triggered after suspense resolved)
      watch(useRoute(), () => {
        head._pauseDOMUpdates.value = false
      })
    })
  }

  nuxtApp._useHead = (_meta: MetaObject | ComputedGetter<MetaObject>) => {
    const meta = ref<MetaObject>(_meta)
    const headObj = computed(() => {
      const overrides: MetaObject = { meta: [] }
      if (meta.value.charset) {
        overrides.meta!.push({ key: "charset", charset: meta.value.charset })
      }
      if (meta.value.viewport) {
        overrides.meta!.push({ name: "viewport", content: meta.value.viewport })
      }
      return defu(overrides, meta.value)
    })
    head.addHeadObjs(headObj as any)

    if (process.server) { return }

    if (headReady) {
      watchEffect(() => { head.updateDOM() })
    }

    const vm = getCurrentInstance()
    if (!vm) { return }

    onBeforeUnmount(() => {
      head.removeHeadObjs(headObj as any)
      head.updateDOM()
    })
  }

  if (process.server) {
    nuxtApp.ssrContext!.renderMeta = () => {
      const meta = renderHeadToString(head)
      return {
        ...meta,
        // resolves naming difference with NuxtMeta and @vueuse/head
        bodyScripts: meta.bodyTags,
      }
    }
  }
})
