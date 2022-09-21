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
import { watch } from "#imports"

export default defineNuxtPlugin((nuxtApp) => {
  const head = createHead()

  nuxtApp.vueApp.use(head)

  const headReady = ref(false)
  nuxtApp.hooks.hookOnce("app:mounted", () => {
    if (head._ssrHydrateFromNodeId === false) {
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
    const ctxUid = vm?.uid
    const hydrateId = ctxUid - vm?.root.uid

    if (process.server) {
      if (ctxUid) {
        head._ssrHydrateFromNodeId = hydrateId
      }
      return
    }

    watch(headReady, (ready) => {
      if (
        ready &&
        (head._ssrHydrateFromNodeId === hydrateId ||
          head._ssrHydrateFromNodeId === false)
      ) {
        head.updateDOM()
      }
    })

    // any reactive change we push straight away outside of hydration updateDOM
    watch(
      meta,
      () => {
        head.updateDOM()
      },
      {
        deep: true,
      },
    )

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
