import type { HeadObject, UseHeadRawInput } from '@vueuse/head'
import type { MaybeComputedRef } from '@vueuse/shared'
import { useNuxtApp } from '#app'

export type MetaObject = HeadObject

export function useHead(meta: MaybeComputedRef<MetaObject>) {
  useNuxtApp()._useHead(meta)
}

export function useHeadSafe(meta: UseHeadRawInput) {
  useNuxtApp()._useHead(meta, { safe: true })
}

export function useMeta(meta: MetaObject) {
  useHead(meta)
}
