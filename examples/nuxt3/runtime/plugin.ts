import { createHead, renderHeadToString } from '@vueuse/head'
import type { ComputedGetter } from 'vue'
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  ref,
  watchEffect,
} from 'vue'
import defu from 'defu'
import type { MetaObject } from '.'
import { defineNuxtPlugin } from '#app'

// Note: This is just a copy of Nuxt's internal head plugin with modifications made for this issue

export default defineNuxtPlugin((nuxtApp) => {
  const head = createHead()

  nuxtApp.vueApp.use(head)

  const headReady = ref(false)
  nuxtApp.hooks.hookOnce('app:mounted', () => {
    watchEffect(() => {
      head.updateDOM()
    })
    headReady.value = true
  })

  nuxtApp._useHead = (_meta: MetaObject | ComputedGetter<MetaObject>) => {
    const meta = ref<MetaObject>(_meta)
    const headObj = computed(() => {
      const overrides: MetaObject = { meta: [] }
      if (meta.value.charset)
        overrides.meta!.push({ key: 'charset', charset: meta.value.charset })

      if (meta.value.viewport)
        overrides.meta!.push({ name: 'viewport', content: meta.value.viewport })

      return defu(overrides, meta.value)
    })
    head.addHeadObjs(headObj as any)

    if (process.server)
      return

    if (headReady.value) {
      watchEffect(() => {
        head.updateDOM()
      })
    }

    const vm = getCurrentInstance()
    if (!vm)
      return

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
