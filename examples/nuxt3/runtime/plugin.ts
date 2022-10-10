import type { HeadEntryOptions } from '@vueuse/head'
import { createHead, renderHeadToString } from '@vueuse/head'
import {
  getCurrentInstance, isRef,
  onBeforeUnmount,
  watchEffect,
} from 'vue'
import type { MetaObject } from '.'
import { defineNuxtPlugin } from '#app'

// Note: This is just a copy of Nuxt's internal head plugin with modifications made for this issue

export default defineNuxtPlugin((nuxtApp) => {
  const head = createHead()

  nuxtApp.vueApp.use(head)

  if (process.client) {
    // pause dom updates until page is ready and between page transitions
    let pauseDOMUpdates = true
    head.hookBeforeDomUpdate.push(() => !pauseDOMUpdates)
    nuxtApp.hooks.hookOnce('app:mounted', () => {
      pauseDOMUpdates = false
      head.updateDOM()

      // start pausing DOM updates when route changes (trigger immediately)
      useRouter().beforeEach(() => {
        pauseDOMUpdates = true
      })
      // watch for new route before unpausing dom updates (triggered after suspense resolved)
      useRouter().afterEach(() => {
        pauseDOMUpdates = false
        head.updateDOM()
      })
    })
  }

  nuxtApp._useHead = (_meta: MetaObject, options: HeadEntryOptions) => {
    const removeSideEffectFns = []

    // only support shortcuts if it's a plain object (avoids ref packing / unpacking)
    if (!isRef(_meta) && typeof _meta === 'object') {
      const shortcutMeta = []
      if (_meta.charset) {
        shortcutMeta.push({
          charset: _meta.charset,
        })
      }
      if (_meta.viewport) {
        shortcutMeta.push({
          name: 'viewport',
          content: _meta.viewport,
        })
      }
      if (shortcutMeta.length) {
        removeSideEffectFns.push(head.addEntry({
          meta: shortcutMeta,
        }))
      }
    }

    if (process.server) {
      head.addEntry(_meta, options)
      return
    }

    const cleanUp = head.addReactiveEntry(_meta, options)

    const vm = getCurrentInstance()
    if (!vm)
      return

    onBeforeUnmount(() => {
      cleanUp()
      removeSideEffectFns.forEach(fn => fn())
      head.updateDOM()
    })
  }

  if (process.server) {
    nuxtApp.ssrContext!.renderMeta = async () => {
      const meta = await renderHeadToString(head)
      return {
        ...meta,
        // resolves naming difference with NuxtMeta and @vueuse/head
        bodyScripts: meta.bodyTags,
      }
    }
  }
})
