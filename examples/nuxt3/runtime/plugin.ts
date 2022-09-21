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
import { defineNuxtPlugin } from "#app"

// Note: This is just a copy of Nuxt's internal head plugin with modifications made for this issue

export default defineNuxtPlugin((nuxtApp) => {
  const head = createHead()

  nuxtApp.vueApp.use(head)

  const headReady = ref(false)
  nuxtApp.hooks.hookOnce("app:mounted", () => {
    if (head._ssrHydrateFromNodeId.value === false) {
      watchEffect(() => {
        head.updateDOM()
      })
    }
    headReady.value = true
  })

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

    const vm = getCurrentInstance()
    // need to offset the root uid for HMR
    const vmUid = vm ? (vm?.uid - vm.root.uid) : 0

    if (process.server) {
      if (vmUid) {
        head._ssrHydrateFromNodeId.value = vmUid
      }
      return
    }

    watchEffect(() => {
      if (
        headReady.value &&
        (head._ssrHydrateFromNodeId.value === false || head._ssrHydrateFromNodeId.value === vmUid)
      ) {
        head.updateDOM()
        // allows other nodes to hydrate, required for any client-specific changes being made
        head._ssrHydrateFromNodeId.value = false
      }
    })

    if (!vm) {
      return
    }

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
